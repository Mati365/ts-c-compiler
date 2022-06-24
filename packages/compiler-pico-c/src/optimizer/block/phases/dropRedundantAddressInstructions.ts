import {isIROutputInstruction} from '@compiler/pico-c/frontend/ir/guards';

import {IRInstruction, isIRLabelOffsetInstruction, isIRLeaInstruction} from '../../../frontend/ir/instructions';
import {IRVariable} from '../../../frontend/ir/variables';
import {dropConstantInstructionArgs} from '../utils/dropConstantInstructionArgs';

export function dropRedundantAddressInstructions(instructions: IRInstruction[]) {
  let hasCache = false;

  const cachedInputs: {[inputVar: string]: IRVariable} = {};
  const replacedOutputs: {[outputVar: string]: IRVariable} = {};
  const newInstructions = [...instructions];

  for (let i = 0; i < newInstructions.length;) {
    const instruction = newInstructions[i];

    if (isIROutputInstruction(instruction)) {
      let cacheKey: string = null;

      if (isIRLeaInstruction(instruction)) {
        ({name: cacheKey} = instruction.inputVar);
      } else if (isIRLabelOffsetInstruction(instruction)) {
        cacheKey = instruction.labelInstruction.name;
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
      const optimizedInstruction = dropConstantInstructionArgs(replacedOutputs, instruction);
      if (optimizedInstruction)
        newInstructions[i] = optimizedInstruction;
    }

    ++i;
  }

  return newInstructions;
}
