import {ASTCCompilerKind, ASTCUnaryExpression} from '@compiler/x86-nano-c/frontend/parser/ast';
import {ASTCTypeCreator} from './ASTCTypeCreator';

/**
 * Assigns type to ASTCUnaryExpressionTypeCreator
 *
 * @export
 * @class ASTCUnaryExpressionTypeCreator
 * @extends {ASTCTypeCreator<ASTCUnaryExpression>}
 */
export class ASTCUnaryExpressionTypeCreator extends ASTCTypeCreator<ASTCUnaryExpression> {
  kind = ASTCCompilerKind.UnaryExpression;

  override leave(node: ASTCUnaryExpression): void {
    node.type = node.castExpression?.type;
  }
}
