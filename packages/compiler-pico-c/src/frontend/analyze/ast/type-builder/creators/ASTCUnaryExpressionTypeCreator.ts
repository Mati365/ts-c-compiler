import { ASTCCompilerKind, ASTCUnaryExpression } from 'frontend/parser/ast';

import { ASTCTypeCreator } from './ASTCTypeCreator';

export class ASTCUnaryExpressionTypeCreator extends ASTCTypeCreator<ASTCUnaryExpression> {
  kind = ASTCCompilerKind.UnaryExpression;

  override leave(node: ASTCUnaryExpression): void {
    node.type = node.castExpression?.type;
  }
}
