import { ASTCCompilerKind, ASTCWhileStatement } from 'frontend/parser/ast';
import { ASTCTypeCreator } from './ASTCTypeCreator';

export class ASTCWhileStmtTypeCreator extends ASTCTypeCreator<ASTCWhileStatement> {
  kind = ASTCCompilerKind.WhileStmt;

  override enter(node: ASTCWhileStatement): boolean {
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
