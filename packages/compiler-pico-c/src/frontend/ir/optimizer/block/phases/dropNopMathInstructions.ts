import { TokenType } from '@compiler/lexer/shared';
import { IRInstruction, isIRMathInstruction } from '../../../instructions';
import { IRInstructionTypedArg } from '../../../variables';
import { dropConstantInstructionArgs } from '../utils';

/**
 * Drops instructions such like:
 *
 *  %t{2}: char*2B = %t{1}: int2B mul %1: int2B
 *
 * It is not used at all.
 */
export function dropNopMathInstructions(instructions: IRInstruction[]) {
  const newInstructions = [...instructions];
  const replaceArgs: Record<string, IRInstructionTypedArg> = {};
  let needSecondPass = false;

  for (let i = 0; i < newInstructions.length; ++i) {
    const instruction = newInstructions[i];

    if (!isIRMathInstruction(instruction)) {
      continue;
    }

    if (
      instruction.operator === TokenType.MUL &&
      instruction.hasAnyConstantArg() &&
      !instruction.hasBothConstantArgs() &&
      instruction.getFirstConstantArg().constant === 0x1
    ) {
      replaceArgs[instruction.outputVar.name] = instruction.getFirstVarArg();
      newInstructions.splice(i, 1);
      needSecondPass = true;
      --i;
    }
  }

  if (needSecondPass) {
    for (let i = 0; i < newInstructions.length; ++i) {
      const optimizedInstruction = dropConstantInstructionArgs(
        replaceArgs,
        newInstructions[i],
      );

      if (optimizedInstruction) {
        newInstructions[i] = optimizedInstruction;
      }
    }
  }

  return newInstructions;
}
