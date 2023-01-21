import { isIRBranchInstruction } from '@compiler/pico-c/frontend/ir/guards';
import { isIRConstant } from '@compiler/pico-c/frontend/ir/variables';

import { IRBlockIterator } from '../iterators/IRBlockIterator';

export function isIRVariableLaterUsed(
  iterator: IRBlockIterator,
  name: string,
): boolean {
  for (
    let offset = iterator.offset + 1;
    offset < iterator.instructions.length;
    ++offset
  ) {
    const instruction = iterator.instructions[offset];

    if (isIRBranchInstruction(instruction)) {
      break;
    }

    for (const arg of instruction.getArgs().input) {
      if (isIRConstant(arg)) {
        continue;
      }

      if (arg.name === name) {
        return true;
      }
    }
  }

  return false;
}
