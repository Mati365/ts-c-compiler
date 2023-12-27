import { ASTCCompoundExpressionStmt } from 'frontend/parser';
import {
  IREmitterContextAttrs,
  IREmitterExpressionResult,
  appendStmtResults,
  createBlankExprResult,
} from '../types';

type CompoundREmitAttrs = IREmitterContextAttrs & {
  node: ASTCCompoundExpressionStmt;
};

export const emitCompoundExpressionIR = ({
  context,
  initializerMeta,
  node,
}: CompoundREmitAttrs): IREmitterExpressionResult => {
  const { emit } = context;
  const result = createBlankExprResult();

  const blockStmt = emit.block({
    scope: node.scope,
    initializerMeta,
    context,
    node,
  });

  appendStmtResults(blockStmt, result);

  const exprResult = emit.expression({
    node: node.expressionStmt,
    scope: node.scope,
    context,
    initializerMeta,
  });

  appendStmtResults(exprResult, result);

  return {
    ...result,
    output: exprResult.output,
  };
};
