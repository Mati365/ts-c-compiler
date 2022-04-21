import {CUnaryCastOperator} from '@compiler/x86-nano-c/constants';
import {ASTCCompilerKind, ASTCCastUnaryExpression} from '@compiler/x86-nano-c/frontend/parser/ast';

import {CPointerType} from '../../types';
import {ASTCTypeCreator} from './ASTCTypeCreator';

/**
 * Assigns type to ASTCCastUnaryExpression
 *
 * @export
 * @class ASTCCastUnaryExpressionTypeCreator
 * @extends {ASTCTypeCreator<ASTCCastUnaryExpression>}
 */
export class ASTCCastUnaryExpressionTypeCreator extends ASTCTypeCreator<ASTCCastUnaryExpression> {
  kind = ASTCCompilerKind.CastUnaryExpression;

  override leave(node: ASTCCastUnaryExpression): void {
    const {arch} = this;
    const {castExpression} = node;

    if (castExpression) {
      let {type} = castExpression;
      switch (node.operator) {
        case CUnaryCastOperator.AND: type = CPointerType.ofType(arch, type); break;
      }

      node.type = type;
    }
  }
}
