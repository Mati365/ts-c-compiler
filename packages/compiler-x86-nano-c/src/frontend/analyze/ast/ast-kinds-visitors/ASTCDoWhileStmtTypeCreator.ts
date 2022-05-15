import {ASTCCompilerKind, ASTCDoWhileStatement} from '@compiler/x86-nano-c/frontend/parser/ast';
import {ASTCTypeCreator} from './ASTCTypeCreator';

/**
 * Assigns type to ASTCDoWhileStatement
 *
 * @export
 * @class ASTCDoWhileStmtTypeCreator
 * @extends {ASTCTypeCreator<ASTCDoWhileStatement>}
 */
export class ASTCDoWhileStmtTypeCreator extends ASTCTypeCreator<ASTCDoWhileStatement> {
  kind = ASTCCompilerKind.DoWhileStmt;

  override enter(node: ASTCDoWhileStatement): boolean {
    const {analyzeVisitor} = this;
    const {expression, statement} = node;

    if (expression)
      analyzeVisitor.visit(expression);

    if (statement)
      analyzeVisitor.visitBlockScope(statement);

    return false;
  }
}
