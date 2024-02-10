import { ASTCCompilerKind, ASTCConditionalExpression } from 'frontend/parser/ast';

import { ASTCTypeCreator } from './ASTCTypeCreator';

export class ASTCConditionalExpressionTypeCreator extends ASTCTypeCreator<ASTCConditionalExpression> {
  kind = ASTCCompilerKind.ConditionalExpression;

  override leave(node: ASTCConditionalExpression): void {
    node.type = node.trueExpression?.type ?? node.falseExpression?.type;
  }
}
