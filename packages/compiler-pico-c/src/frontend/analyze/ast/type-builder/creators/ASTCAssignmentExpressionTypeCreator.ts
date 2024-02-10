import { isFloatMathOpToken, isMathOpToken } from '@ts-c-compiler/lexer';
import { ASTCCompilerKind, ASTCAssignmentExpression } from 'frontend/parser/ast';

import { checkLeftTypeOverlapping } from '../../../checker';
import { CTypeCheckError, CTypeCheckErrorCode } from '../../../errors/CTypeCheckError';

import { ASTCTypeCreator } from './ASTCTypeCreator';
import { isPrimitiveLikeType } from 'frontend/analyze/types';
import { CCOMPILER_ASSIGN_MATH_OPERATORS } from '#constants';

export class ASTCAssignmentExpressionTypeCreator extends ASTCTypeCreator<ASTCAssignmentExpression> {
  kind = ASTCCompilerKind.AssignmentExpression;

  override leave(node: ASTCAssignmentExpression): void {
    if (node.type) {
      return;
    }

    if (node.isOperatorExpression()) {
      const { unaryExpression: left, expression: right, operator: op } = node;
      const mathToken = CCOMPILER_ASSIGN_MATH_OPERATORS[op];

      if (left?.type?.isConst()) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.ASSIGNMENT_TO_CONST,
          node.loc.start,
          {
            left: left?.type?.getShortestDisplayName() ?? '<unknown-left-expr-type>',
          },
        );
      }

      if (
        mathToken &&
        isMathOpToken(mathToken) &&
        !isFloatMathOpToken(mathToken) &&
        isPrimitiveLikeType(left?.type, true) &&
        isPrimitiveLikeType(right?.type, true) &&
        left.type.isFloating() !== right.type.isFloating()
      ) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.MATH_EXPRESSION_MUST_BE_INTEGRAL_TYPE,
          node.loc.start,
          {
            left: left?.type?.getShortestDisplayName() ?? '<unknown-left-expr-type>',
            right: right?.type?.getShortestDisplayName() ?? '<unknown-right-expr-type>',
          },
        );
      }

      if (!checkLeftTypeOverlapping(left?.type, right?.type)) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.ASSIGNMENT_EXPRESSION_TYPES_MISMATCH,
          node.loc.start,
          {
            left: left?.type?.getShortestDisplayName() ?? '<unknown-left-expr-type>',
            right: right?.type?.getShortestDisplayName() ?? '<unknown-right-expr-type>',
          },
        );
      }

      node.type = left.type;
    } else if (node.hasNestedExpression()) {
      node.type = node.expression.type;
    } else if (node.isConditionalExpression()) {
      node.type = node.conditionalExpression.type;
    } else if (node.isUnaryExpression()) {
      node.type = node.unaryExpression.type;
    }
  }
}
