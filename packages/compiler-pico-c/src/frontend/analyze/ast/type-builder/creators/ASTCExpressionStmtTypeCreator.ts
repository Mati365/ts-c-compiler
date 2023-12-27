import { ASTCCompilerKind, ASTCExpressionStatement } from 'frontend/parser/ast';
import { ASTCTypeCreator } from './ASTCTypeCreator';

export class ASTCExpressionStmtTypeCreator extends ASTCTypeCreator<ASTCExpressionStatement> {
  kind = ASTCCompilerKind.ExpressionStmt;

  override leave(node: ASTCExpressionStatement): void {
    node.type ??= node.expression?.type;
  }
}
