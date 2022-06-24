import {IRInstruction} from '../../frontend/ir/instructions';
import {
  dropDeadStoreInstructions,
  dropOrConcatConstantInstructions,
  dropRedundantAddressInstructions,
} from './phases';

const MAX_OPTIMIZER_WATCHDOG_ITERATIONS = 4;

export function optimizeInstructionsList(instructions: IRInstruction[]) {
  let newInstructions: IRInstruction[] = instructions;

  for (let i = 0; i < MAX_OPTIMIZER_WATCHDOG_ITERATIONS; ++i) {
    const optimizedInstructions = dropDeadStoreInstructions(
      dropOrConcatConstantInstructions(
        dropRedundantAddressInstructions(newInstructions),
      ),
    );

    if (optimizedInstructions.length >= newInstructions.length)
      break;

    newInstructions = optimizedInstructions;
  }

  return newInstructions;
}
