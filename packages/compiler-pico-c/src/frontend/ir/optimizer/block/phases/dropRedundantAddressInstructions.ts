import { isIRBranchInstruction, isIROutputInstruction } from '../../../guards';
import { dropConstantInstructionArgs } from '../utils/dropConstantInstructionArgs';

import { IRVariable } from '../../../variables';
import {
  IRInstruction,
  isIRCallInstruction,
  isIRLabelOffsetInstruction,
  isIRLeaInstruction,
} from '../../../instructions';

export function dropRedundantAddressInstructions(
  instructions: IRInstruction[],
) {
  let hasCache = false;

  let cachedInputs: { [inputVar: string]: IRVariable } = {};
  let replacedOutputs: { [outputVar: string]: IRVariable } = {};
  const newInstructions = [...instructions];

  for (let i = 0; i < newInstructions.length; ) {
    const instruction = newInstructions[i];

    if (isIRBranchInstruction(instruction)) {
      if (isIRCallInstruction(instruction)) {
        newInstructions[i] =
          dropConstantInstructionArgs(replacedOutputs, instruction) ??
          newInstructions[i];
      }

      replacedOutputs = {};
      cachedInputs = {};
      hasCache = false;
      ++i;
      continue;
    }

    if (isIROutputInstruction(instruction)) {
      let cacheKey: string = null;

      if (isIRLeaInstruction(instruction)) {
        ({ name: cacheKey } = instruction.inputVar);
      } else if (isIRLabelOffsetInstruction(instruction)) {
        cacheKey = instruction.label.name;
      }

      if (cacheKey) {
        cacheKey = `${instruction.opcode}-${cacheKey}`;

        const cachedArg = cachedInputs[cacheKey];
        if (cachedArg) {
          replacedOutputs[instruction.outputVar.name] = cachedArg;
          newInstructions.splice(i, 1);
        } else {
          hasCache = true;
          cachedInputs[cacheKey] = instruction.outputVar;
          ++i;
        }

        continue;
      }
    }

    if (hasCache) {
      const optimizedInstruction = dropConstantInstructionArgs(
        replacedOutputs,
        instruction,
      );

      if (optimizedInstruction) {
        newInstructions[i] = optimizedInstruction;
      }
    }

    ++i;
  }

  return newInstructions;
}
