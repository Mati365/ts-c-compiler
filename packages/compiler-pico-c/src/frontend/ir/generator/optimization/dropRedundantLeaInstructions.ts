import {IRInstruction, isIRLeaInstruction} from '../../instructions';
import {IRVariable, isIRVariable} from '../../variables';

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
      const {input, output} = instruction.getArgs();
      let modifiedArgs = false;

      for (let j = 0; j < input.length; ++j) {
        const arg = input[j];

        if (isIRVariable(arg)) {
          const cachedArg = replacedLea[arg.name];

          if (cachedArg) {
            input[j] = cachedArg;
            modifiedArgs = true;
          }
        }
      }

      if (modifiedArgs) {
        newInstructions[i] = instruction.ofArgs(
          {
            input,
            output,
          },
        );
      }
    }

    ++i;
  }

  return newInstructions;
}
