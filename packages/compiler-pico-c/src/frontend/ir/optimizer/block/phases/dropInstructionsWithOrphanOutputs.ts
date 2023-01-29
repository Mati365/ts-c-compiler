import {
  IRInstruction,
  isIRLeaInstruction,
  isIRMathInstruction,
} from '../../../instructions';

import { isOutputInstruction } from '../../../interfaces';
import { isIRVariable } from '../../../variables';

type InstructionOutputUsageInfo = {
  instruction: IRInstruction;
  times: number;
};

/**
 * Used after all optimizations that produces orphans.
 *
 * Reduces:
 *
 * %t{0}: int*2B = lea array{0}: int[3]*2B
 * %t{1}: int*2B = %t{0}: int*2B plus %2: int2B
 * *(%t{0}: int*2B + %2) = store %3: int2B
 * %t{3}: int*2B = %t{0}: int*2B plus %4: int2B
 * *(%t{0}: int*2B + %4) = store %4: int2B
 *
 * To:
 *
 * %t{0}: int*2B = lea array{0}: int[3]*2B
 * *(%t{0}: int*2B + %2) = store %3: int2B
 * *(%t{0}: int*2B + %4) = store %4: int2B
 */
export function dropInstructionsWithOrphanOutputs(
  instructions: IRInstruction[],
) {
  const newInstructions = [...instructions];
  const counters: Record<string, InstructionOutputUsageInfo> = {};

  for (let i = 0; i < newInstructions.length; ++i) {
    const instruction = newInstructions[i];

    if (isOutputInstruction(instruction) && instruction.outputVar) {
      // track definition
      counters[instruction.outputVar.name] ??= {
        instruction,
        times: 0,
      };

      counters[instruction.outputVar.name].times++;
    }

    // track usage
    for (const input of instruction.getArgs().input) {
      if (!isIRVariable(input)) {
        continue;
      }

      if (input.name in counters) {
        counters[input.name].times++;
      }
    }
  }

  for (const { instruction, times } of Object.values(counters)) {
    if (times > 1) {
      continue;
    }

    if (isIRMathInstruction(instruction) || isIRLeaInstruction(instruction)) {
      newInstructions.splice(newInstructions.indexOf(instruction), 1);
    }
  }

  return newInstructions;
}
