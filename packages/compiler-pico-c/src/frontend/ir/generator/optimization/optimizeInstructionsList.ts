import * as R from 'ramda';

import {IRInstruction} from '../../instructions';

import {dropOrConcatConstantInstructions} from './dropOrConcatConstantInstructions';
import {dropRedundantLeaInstructions} from './dropRedundantLeaInstructions';

export type IRInstructionsOptimizationAttrs = {
  enabled?: boolean;
};

export function optimizeInstructionsList(
  instructions: IRInstruction[],
  {
    enabled = true,
  }: IRInstructionsOptimizationAttrs = {},
) {
  if (!enabled)
    return instructions;

  return R.pipe(
    dropOrConcatConstantInstructions,
    dropRedundantLeaInstructions,
  )(instructions);
}
