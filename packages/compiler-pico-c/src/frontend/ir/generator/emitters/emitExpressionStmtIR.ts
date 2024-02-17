import { GroupTreeVisitor } from '@ts-cc/grammar';
import {
  ASTCCompilerKind,
  ASTCCompilerNode,
  ASTCExpression,
  ASTCExpressionStatement,
} from 'frontend/parser';

import { emitExpressionIR } from './emit-expr';
import {
  appendStmtResults,
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from './types';

export type ExpressionStmtIRAttrs = IREmitterContextAttrs & {
  node: ASTCExpressionStatement;
};

export function emitExpressionStmtIR({
  scope,
  context,
  node,
}: ExpressionStmtIRAttrs): IREmitterStmtResult {
  const result = createBlankStmtResult();

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>({
    [ASTCCompilerKind.Expression]: {
      enter(exprNode: ASTCExpression) {
        const stmtResult = emitExpressionIR({
          node: exprNode,
          scope,
          context,
        });

        appendStmtResults(stmtResult, result);
        return false;
      },
    },
  })(node);

  return result;
}
