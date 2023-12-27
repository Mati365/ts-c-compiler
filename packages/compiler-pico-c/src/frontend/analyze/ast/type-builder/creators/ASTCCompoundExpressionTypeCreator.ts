import {
  ASTCCompilerKind,
  ASTCCompoundExpressionStmt,
} from 'frontend/parser/ast';

import { ASTCTypeCreator } from './ASTCTypeCreator';

export class ASTCCompoundExpressionTypeCreator extends ASTCTypeCreator<ASTCCompoundExpressionStmt> {
  kind = ASTCCompilerKind.CompoundExpressionStmt;

  override enter(node: ASTCCompoundExpressionStmt): boolean {
    node.scope = this.analyzeVisitor.enterScope(node, visitor => {
      for (const child of node.children) {
        visitor.visit(child);
      }

      visitor.visit(node.expressionStmt);
    });

    node.type = node.expressionStmt.type;
    return false;
  }
}
