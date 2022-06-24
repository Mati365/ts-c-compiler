import {IRInstruction} from '../../frontend/ir/instructions';
import {
  dropOrConcatConstantInstructions,
  dropDeadStoreInstructions,
  dropRedundantLeaInstructions,
} from './phases';

export function optimizeInstructionsList(instructions: IRInstruction[]) {
  return dropDeadStoreInstructions(
    dropOrConcatConstantInstructions(
      dropRedundantLeaInstructions(instructions),
    ),
  );
}
