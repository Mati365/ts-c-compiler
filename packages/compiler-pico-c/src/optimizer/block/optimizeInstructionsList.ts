import {IRInstruction} from '../../frontend/ir/instructions';

import {dropOrConcatConstantInstructions} from './phases/dropOrConcatConstantInstructions';
import {dropRedundantLeaInstructions} from './phases/dropRedundantLeaInstructions';

export function optimizeInstructionsList(
  instructions: IRInstruction[],
) {
  return dropOrConcatConstantInstructions(
    dropRedundantLeaInstructions(instructions),
  );
}
