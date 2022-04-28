import {ASTCCompilerKind, ASTCIfStatement} from '@compiler/x86-nano-c/frontend/parser/ast';
import {ASTCTypeCreator} from './ASTCTypeCreator';

/**
 * Assigns type to ASTCIfStmtTypeCreator
 *
 * @export
 * @class ASTCIfStmtTypeCreator
 * @extends {ASTCTypeCreator<ASTCUnaryExpression>}
 */
export class ASTCIfStmtTypeCreator extends ASTCTypeCreator<ASTCIfStatement> {
  kind = ASTCCompilerKind.IfStmt;

  override enter(node: ASTCIfStatement): boolean {
    const {analyzeVisitor} = this;
    const {
      trueExpression,
      falseExpression,
      logicalExpression,
    } = node;

    if (logicalExpression)
      analyzeVisitor.visit(logicalExpression);

    if (trueExpression)
      analyzeVisitor.ofBlockScope(trueExpression).visit();

    if (falseExpression)
      analyzeVisitor.ofBlockScope(falseExpression).visit();

    return false;
  }
}
