import {IRInstruction, isIRLeaInstruction} from '../../instructions';
import {IRVariable} from '../../variables';
import {dropConstantInstructionArgs} from './dropConstantInstructionArgs';

export function dropRedundantLeaInstructions(instructions: IRInstruction[]) {
  let hasCache = false;

  const cachedLea: {[inputVar: string]: IRVariable} = {};
  const replacedLea: {[outputVar: string]: IRVariable} = {};
  const newInstructions = [...instructions];

  for (let i = 0; i < newInstructions.length;) {
    const instruction = newInstructions[i];

    if (isIRLeaInstruction(instruction)) {
      const {name: inputName} = instruction.inputVar;
      const cachedArg = cachedLea[inputName];

      if (cachedArg) {
        replacedLea[instruction.outputVar.name] = cachedArg;
        newInstructions.splice(i, 1);
        continue;
      } else {
        hasCache = true;
        cachedLea[inputName] = instruction.outputVar;
      }
    } else if (hasCache) {
      const optimizedInstruction = dropConstantInstructionArgs(replacedLea, instruction);
      if (optimizedInstruction)
        newInstructions[i] = optimizedInstruction;
    }

    ++i;
  }

  return newInstructions;
}
