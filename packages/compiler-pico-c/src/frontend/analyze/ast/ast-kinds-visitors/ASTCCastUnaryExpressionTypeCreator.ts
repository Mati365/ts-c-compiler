import {CUnaryCastOperator} from '@compiler/pico-c/constants';
import {ASTCCompilerKind, ASTCCastUnaryExpression} from '@compiler/pico-c/frontend/parser/ast';

import {CPointerType, isArrayLikeType, isPointerLikeType} from '../../types';
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
        case CUnaryCastOperator.AND:
          type = CPointerType.ofType(arch, type);
          break;

        case CUnaryCastOperator.MUL:
          if (isArrayLikeType(type))
            type = type.getSourceType();
          else if (isPointerLikeType(type))
            type = type.baseType;
      }

      node.type = type;
    }
  }
}
