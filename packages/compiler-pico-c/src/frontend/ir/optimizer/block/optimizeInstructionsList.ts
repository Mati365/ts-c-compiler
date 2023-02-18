import { compose } from 'ramda';
import { IRInstruction } from '../../instructions';
import {
  concatConstantStoreInstruction,
  dropConstantLabelOffsetsArgs,
  dropDeadStoreInstructions,
  dropInstructionsWithOrphanOutputs,
  dropNopMathInstructions,
  dropOrConcatConstantInstructions,
  dropRedundantAddressInstructions,
  dropRedundantLabelInstructions,
  flipMathInstructionsOperands,
  foldAddressOffsetsInstructions,
} from './phases';

type OptimizerConfig = {
  maxIterations?: number;
};

const optimizeFlow = compose(
  dropInstructionsWithOrphanOutputs,
  concatConstantStoreInstruction,
  foldAddressOffsetsInstructions,
  dropRedundantLabelInstructions,
  dropDeadStoreInstructions,
  dropOrConcatConstantInstructions,
  dropRedundantAddressInstructions,
  dropNopMathInstructions,
  flipMathInstructionsOperands,
  dropConstantLabelOffsetsArgs,
);

export function optimizeInstructionsList(
  instructions: IRInstruction[],
  { maxIterations = 4 }: OptimizerConfig = {},
) {
  let newInstructions: IRInstruction[] = instructions;

  for (let i = 0; i < maxIterations; ++i) {
    const optimizedInstructions = optimizeFlow(newInstructions);

    if (optimizedInstructions.length >= newInstructions.length) {
      return optimizedInstructions;
    }

    newInstructions = optimizedInstructions;
  }

  return newInstructions;
}
