import {ASTCPostfixExpression} from '@compiler/pico-c/frontend/parser';
import {
  appendStmtResults,
  createBlankExprResult,
  IREmitterContextAttrs,
  IREmitterExpressionResult,
} from './types';

export type FnCallExpressionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCPostfixExpression;
};

export function emitFnCallExpressionIR(
  {
    context,
    scope,
    node,
  }: FnCallExpressionIREmitAttrs,
): IREmitterExpressionResult {
  const {emit} = context;

  const result = createBlankExprResult();
  const irFnAddressVarExpr = emit.expression(
    {
      node: node.postfixExpression,
      scope,
      context,
    },
  );

  appendStmtResults(irFnAddressVarExpr, result);
  return result;
}
