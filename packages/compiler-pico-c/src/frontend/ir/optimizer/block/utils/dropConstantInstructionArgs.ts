import { IRInstruction } from '../../../instructions';
import { IRInstructionTypedArg, isIRVariable } from '../../../variables';

export function dropConstantInstructionArgs(
  constantArgs: Record<string, IRInstructionTypedArg>,
  instruction: IRInstruction,
) {
  let { input, output } = instruction.getArgs();
  let modifiedArgs = false;

  for (let j = 0; j < input.length; ++j) {
    const arg = input[j];

    if (isIRVariable(arg)) {
      const cachedArg = constantArgs[arg.name];

      if (cachedArg) {
        input[j] = cachedArg;
        modifiedArgs = true;
      }
    }
  }

  // handle *(t{0}) = 123
  const cachedOutput = constantArgs[output?.name];
  if (isIRVariable(cachedOutput)) {
    output = cachedOutput;
    modifiedArgs = true;
  }

  if (modifiedArgs) {
    return instruction.ofArgs({
      input,
      output,
    });
  }

  return null;
}
