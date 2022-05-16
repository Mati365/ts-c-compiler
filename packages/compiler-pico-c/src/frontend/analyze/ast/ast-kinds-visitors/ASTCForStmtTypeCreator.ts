import {ASTCCompilerKind, ASTCForStatement} from '@compiler/pico-c/frontend/parser/ast';
import {ASTCTypeCreator} from './ASTCTypeCreator';

/**
 * Assigns type to ASTCForStmtTypeCreator
 *
 * @export
 * @class ASTCForStmtTypeCreator
 * @extends {ASTCTypeCreator<ASTCForStatement>}
 */
export class ASTCForStmtTypeCreator extends ASTCTypeCreator<ASTCForStatement> {
  kind = ASTCCompilerKind.ForStmt;

  override enter(node: ASTCForStatement): boolean {
    const {analyzeVisitor} = this;
    const {
      declaration,
      condition,
      expression,
      statement,
    } = node;

    analyzeVisitor.enterScope(node, (visitor) => {
      visitor
        .visit(declaration)
        .visit(condition)
        .visit(expression)
        .visit(statement);
    });

    return false;
  }
}
