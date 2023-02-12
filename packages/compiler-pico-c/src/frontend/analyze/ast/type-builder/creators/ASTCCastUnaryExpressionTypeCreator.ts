import { CUnaryCastOperator } from '@compiler/pico-c/constants';
import {
  ASTCCompilerKind,
  ASTCCastUnaryExpression,
} from '@compiler/pico-c/frontend/parser/ast';

import { isImplicitPtrType } from '../../../types/utils';

import { ASTCTypeCreator } from './ASTCTypeCreator';
import {
  CPointerType,
  isArrayLikeType,
  isFuncDeclLikeType,
  isPointerLikeType,
} from '../../../types';

export class ASTCCastUnaryExpressionTypeCreator extends ASTCTypeCreator<ASTCCastUnaryExpression> {
  kind = ASTCCompilerKind.CastUnaryExpression;

  override leave(node: ASTCCastUnaryExpression): void {
    const { castExpression } = node;

    if (castExpression) {
      let { type } = castExpression;

      switch (node.operator) {
        case CUnaryCastOperator.AND:
          // treat &arr the same way as arr
          if (!isImplicitPtrType(type)) {
            type = CPointerType.ofType(type);
          }
          break;

        case CUnaryCastOperator.MUL:
          if (isArrayLikeType(type)) {
            type = type.getSourceType();
            // do not load pointer value type of function such like (*fn)(1, 2, 3)
          } else if (
            isPointerLikeType(type) &&
            !isFuncDeclLikeType(type.baseType)
          ) {
            type = type.baseType;
          }
          break;
      }

      node.type = type;
    }
  }
}
