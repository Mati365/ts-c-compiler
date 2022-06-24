import {IRInstruction} from '../../../frontend/ir/instructions';
import {IRInstructionVarArg, isIRVariable} from '../../../frontend/ir/variables';

export function dropConstantInstructionArgs(
  constantArgs: Record<string, IRInstructionVarArg>,
  instruction: IRInstruction,
) {
  const {input, output} = instruction.getArgs();
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

  if (modifiedArgs) {
    return instruction.ofArgs(
      {
        input,
        output,
      },
    );
  }

  return null;
}
