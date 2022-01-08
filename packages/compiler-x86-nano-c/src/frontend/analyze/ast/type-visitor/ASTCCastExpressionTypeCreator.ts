import {ASTCCompilerKind, ASTCCastExpression} from '@compiler/x86-nano-c/frontend/parser/ast';
import {ASTCTypeCreator} from './ASTCTypeCreator';

import {extractSpecifierType} from '../type-builder';

/**
 * Assigns type to ASTCCastExpression
 *
 * @export
 * @class ASTCCastExpressionTypeCreator
 * @extends {ASTCTypeCreator<ASTCCastExpression>}
 */
export class ASTCCastExpressionTypeCreator extends ASTCTypeCreator<ASTCCastExpression> {
  kind = ASTCCompilerKind.CastExpression;

  override leave(node: ASTCCastExpression): void {
    const {context} = this;
    const {typeName} = node;

    node.type = extractSpecifierType(
      {
        context,
        specifier: typeName.specifierList,
      },
    );
  }
}
