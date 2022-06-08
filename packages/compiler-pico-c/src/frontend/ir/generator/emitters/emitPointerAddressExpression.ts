import {ASTCCastUnaryExpression} from '@compiler/pico-c/frontend/parser';

import {IRLeaInstruction} from '../../instructions';
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
  const {allocator} = context;
  const {instructions, output, ...result} = context.emit.emitIdentifierGetter(
    {
      emitLoadPtr: false,
      node: node.castExpression,
      context,
      scope,
    },
  );

  const addrVariable = allocator.allocAddressVariable();
  instructions.push(
    new IRLeaInstruction(output, addrVariable),
  );

  return {
    ...result,
    output: addrVariable,
    instructions,
  };
}
