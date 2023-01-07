import {
  ASTCCompilerKind,
  ASTCAssignmentExpression,
} from '@compiler/pico-c/frontend/parser/ast';
import {
  CTypeCheckError,
  CTypeCheckErrorCode,
} from '../../../errors/CTypeCheckError';
import { ASTCTypeCreator } from './ASTCTypeCreator';

import { checkLeftTypeOverlapping } from '../../../checker';

export class ASTCAssignmentExpressionTypeCreator extends ASTCTypeCreator<ASTCAssignmentExpression> {
  kind = ASTCCompilerKind.AssignmentExpression;

  override leave(node: ASTCAssignmentExpression): void {
    if (node.type) {
      return;
    }

    if (node.isOperatorExpression()) {
      const { unaryExpression: left, expression: right } = node;

      if (!checkLeftTypeOverlapping(left?.type, right?.type)) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.ASSIGNMENT_EXPRESSION_TYPES_MISMATCH,
          node.loc.start,
          {
            left:
              left?.type?.getShortestDisplayName() ??
              '<unknown-left-expr-type>',
            right:
              right?.type?.getShortestDisplayName() ??
              '<unknown-right-expr-type>',
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
