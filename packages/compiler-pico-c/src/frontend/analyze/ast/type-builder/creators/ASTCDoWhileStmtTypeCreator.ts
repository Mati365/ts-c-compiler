import { ASTCCompilerKind, ASTCDoWhileStatement } from 'frontend/parser/ast';
import { ASTCTypeCreator } from './ASTCTypeCreator';

export class ASTCDoWhileStmtTypeCreator extends ASTCTypeCreator<ASTCDoWhileStatement> {
  kind = ASTCCompilerKind.DoWhileStmt;

  override enter(node: ASTCDoWhileStatement): boolean {
    const { analyzeVisitor } = this;
    const { expression, statement } = node;

    if (expression) {
      analyzeVisitor.visit(expression);
    }

    if (statement) {
      analyzeVisitor.visitBlockScope(statement);
    }

    return false;
  }
}
