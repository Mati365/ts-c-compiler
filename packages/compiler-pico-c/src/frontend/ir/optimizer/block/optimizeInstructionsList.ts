import { IRInstruction } from '../../instructions';
import {
  dropDeadStoreInstructions,
  dropOrConcatConstantInstructions,
  dropRedundantAddressInstructions,
  dropRedundantLabelInstructions,
  foldAddressOffsetsInstructions,
} from './phases';

const MAX_OPTIMIZER_WATCHDOG_ITERATIONS = 4;

export function optimizeInstructionsList(instructions: IRInstruction[]) {
  let newInstructions: IRInstruction[] = instructions;

  for (let i = 0; i < MAX_OPTIMIZER_WATCHDOG_ITERATIONS; ++i) {
    const optimizedInstructions = foldAddressOffsetsInstructions(
      dropRedundantLabelInstructions(
        dropDeadStoreInstructions(
          dropOrConcatConstantInstructions(
            dropRedundantAddressInstructions(newInstructions),
          ),
        ),
      ),
    );

    if (optimizedInstructions.length >= newInstructions.length) {
      return optimizedInstructions;
    }

    newInstructions = optimizedInstructions;
  }

  return newInstructions;
}
