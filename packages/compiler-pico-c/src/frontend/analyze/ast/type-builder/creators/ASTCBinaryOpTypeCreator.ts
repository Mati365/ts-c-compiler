import {ASTCCompilerKind, ASTCBinaryOpNode} from '@compiler/pico-c/frontend/parser/ast';
import {TokenType} from '@compiler/lexer/shared';

import {ASTCTypeCreator} from './ASTCTypeCreator';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../../errors/CTypeCheckError';

import {checkLeftTypeOverlapping, isPointerArithmeticOperator} from '../../../checker';
import {tryCastToPointer} from '../../../casts';
import {isPointerLikeType} from '../../../types';

export class ASTCBinaryOpTypeCreator extends ASTCTypeCreator<ASTCBinaryOpNode> {
  kind = ASTCCompilerKind.BinaryOperator;

  override leave(node: ASTCBinaryOpNode): void {
    if (node.hasSingleSide())
      return;

    const {left, right, op} = node;
    const leftType = tryCastToPointer(left.type);
    const rightType = tryCastToPointer(right.type);

    if (!checkLeftTypeOverlapping(leftType, rightType)) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.OPERATOR_SIDES_TYPES_MISMATCH,
        node.loc.start,
        {
          left: left?.type?.getShortestDisplayName() ?? '<unknown-left-expr-type>',
          right: right?.type?.getShortestDisplayName() ?? '<unknown-right-expr-type>',
        },
      );
    }

    const leftPtr = isPointerLikeType(leftType);
    const rightPtr = isPointerLikeType(rightType);

    if (leftPtr || rightPtr) {
      if ((leftPtr && rightPtr) || (rightPtr && !leftPtr && op !== TokenType.PLUS)) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.INCORRECT_POINTER_SIDES_TYPES,
          node.loc.start,
          {
            operator: op,
            left: left?.type?.getShortestDisplayName(),
            right: right?.type?.getShortestDisplayName(),
          },
        );
      }

      if (!isPointerArithmeticOperator(op)) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.WRONG_POINTER_MATH_OPERATOR,
          node.loc.start,
          {
            operator: op,
          },
        );
      }
    }

    node.type = leftType;
  }
}
