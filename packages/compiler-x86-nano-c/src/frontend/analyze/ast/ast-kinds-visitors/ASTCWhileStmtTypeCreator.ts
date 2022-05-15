import {ASTCCompilerKind, ASTCWhileStatement} from '@compiler/x86-nano-c/frontend/parser/ast';
import {ASTCTypeCreator} from './ASTCTypeCreator';

/**
 * Assigns type to ASTCWhileStatement
 *
 * @export
 * @class ASTCWhileStmtTypeCreator
 * @extends {ASTCTypeCreator<ASTCWhileStatement>}
 */
export class ASTCWhileStmtTypeCreator extends ASTCTypeCreator<ASTCWhileStatement> {
  kind = ASTCCompilerKind.WhileStmt;

  override enter(node: ASTCWhileStatement): boolean {
    const {analyzeVisitor} = this;
    const {expression, statement} = node;

    if (expression)
      analyzeVisitor.visit(expression);

    if (statement)
      analyzeVisitor.visitBlockScope(statement);

    return false;
  }
}
