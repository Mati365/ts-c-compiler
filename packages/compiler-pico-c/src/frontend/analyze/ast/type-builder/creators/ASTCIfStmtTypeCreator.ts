import {ASTCCompilerKind, ASTCIfStatement} from '@compiler/pico-c/frontend/parser/ast';
import {ASTCTypeCreator} from './ASTCTypeCreator';

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
      analyzeVisitor.visitBlockScope(trueExpression);

    if (falseExpression)
      analyzeVisitor.visitBlockScope(falseExpression);

    return false;
  }
}
