import {ASTCCastUnaryExpression} from '@compiler/pico-c/frontend/parser';
import {CIRLoadInstruction} from '../../instructions';

import {IREmitterContextAttrs, IREmitterExpressionResult} from './types';
import {IRInstructionsOptimizationAttrs} from '../optimization';

export type PointerExpressionIREmitAttrs = IREmitterContextAttrs & {
  optimization?: IRInstructionsOptimizationAttrs;
  node: ASTCCastUnaryExpression;
  emitLoadPtr?: boolean;
};

/**
 * @see
 *  This function assumes that last operations
 */
export function emitPointerExpression(
  {
    context,
    scope,
    node,
    emitLoadPtr = true,
  }: PointerExpressionIREmitAttrs,
): IREmitterExpressionResult {
  const {type} = node;
  const {allocator, emit} = context;

  const exprResult = emit.expression(
    {
      type: node.type,
      node: node.castExpression,
      context,
      scope,
    },
  );

  if (emitLoadPtr) {
    const {instructions} = exprResult;
    const resultPtrOutput = allocator.allocTmpVariable(type);

    instructions.push(
      new CIRLoadInstruction(exprResult.output, resultPtrOutput),
    );

    return {
      output: resultPtrOutput,
      instructions,
    };
  }

  return exprResult;
}
