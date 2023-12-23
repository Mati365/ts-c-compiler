import { compose } from 'ramda';
import { IRInstruction } from '../../instructions';
import {
  concatConstantStoreInstruction,
  dropConstantBranchInstructions,
  dropConstantLabelOffsetsArgs,
  dropDeadStoreInstructions,
  dropInstructionsWithOrphanOutputs,
  dropOrConcatConstantInstructions,
  dropRedundantAddressInstructions,
  dropRedundantLabelInstructions,
  dropRedundantLoadInstructions,
  flipMathInstructionsOperands,
  foldAddressOffsetsInstructions,
  reassignPhiInstructions,
} from './phases';

type OptimizerConfig = {
  maxIterations?: number;
};

const optimizeFlow = compose(
  dropInstructionsWithOrphanOutputs,
  dropRedundantLoadInstructions,
  concatConstantStoreInstruction,
  foldAddressOffsetsInstructions,
  dropRedundantLabelInstructions,
  dropDeadStoreInstructions,
  dropOrConcatConstantInstructions,
  dropRedundantAddressInstructions,
  flipMathInstructionsOperands,
  dropConstantLabelOffsetsArgs,
  reassignPhiInstructions,
  dropConstantBranchInstructions,
);

export function optimizeInstructionsList(
  instructions: IRInstruction[],
  { maxIterations = 9 }: OptimizerConfig = {},
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
