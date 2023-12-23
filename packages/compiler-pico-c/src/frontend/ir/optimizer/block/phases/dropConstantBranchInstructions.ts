import {
  IRInstruction,
  IRJmpInstruction,
  isIRBrInstruction,
} from '../../../instructions';
import { isIRConstant } from 'frontend/ir/variables';

/**
 * Transforms:
 *    br %1: char1B, false: L2
 *
 * to plain `jmp`
 */
export function dropConstantBranchInstructions(instructions: IRInstruction[]) {
  const newInstructions = [];

  for (const instruction of instructions) {
    if (isIRBrInstruction(instruction) && isIRConstant(instruction.variable)) {
      const { constant } = instruction.variable;
      const { ifTrue, ifFalse } = instruction;

      if (constant && ifTrue) {
        newInstructions.push(new IRJmpInstruction(ifTrue));
      } else if (!constant && ifFalse) {
        newInstructions.push(new IRJmpInstruction(ifFalse));
      }

      continue;
    }

    newInstructions.push(instruction);
  }

  return newInstructions;
}
