import {ASTCCastUnaryExpression} from '@compiler/pico-c/frontend/parser';
import {IRInstructionsOptimizationAttrs} from '../optimization';
import {IREmitterContextAttrs, IREmitterExpressionResult} from './types';

export type PointerAddressExpressionIREmitAttrs = IREmitterContextAttrs & {
  optimization?: IRInstructionsOptimizationAttrs;
  node: ASTCCastUnaryExpression;
};

export function emitPointerAddressExpression(
  {
    context,
    scope,
    node,
  }: PointerAddressExpressionIREmitAttrs,
): IREmitterExpressionResult {
  return context.emit.lvalueExpression(
    {
      emitLoadPtr: false,
      node: node.castExpression,
      context,
      scope,
      optimization: {
        enabled: false,
      },
    },
  );
}
