import { compose } from 'ramda';
import { IRInstruction } from '../../instructions';
import {
  concatConstantStoreInstruction,
  dropDeadStoreInstructions,
  dropInstructionsWithOrphanOutputs,
  dropOrConcatConstantInstructions,
  dropRedundantAddressInstructions,
  dropRedundantLabelInstructions,
  foldAddressOffsetsInstructions,
} from './phases';

type OptimizerConfig = {
  maxIterations?: number;
};

const optimizeFlow = compose(
  concatConstantStoreInstruction,
  dropInstructionsWithOrphanOutputs,
  foldAddressOffsetsInstructions,
  dropRedundantLabelInstructions,
  dropDeadStoreInstructions,
  dropOrConcatConstantInstructions,
  dropRedundantAddressInstructions,
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
