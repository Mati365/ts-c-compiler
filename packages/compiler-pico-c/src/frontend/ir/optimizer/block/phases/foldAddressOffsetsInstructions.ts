import { isNil } from 'ramda';
import { isIRBranchInstruction } from '../../../guards';
import {
  IRInstruction,
  IRLeaInstruction,
  IRMathInstruction,
  isIRLeaInstruction,
  isIRMathInstruction,
  isIRStoreInstruction,
} from '../../../instructions';

import { IRConstant, isIRVariable } from '../../../variables';
import {
  dropConstantInstructionArgs,
  tryEvalConstArgsBinaryInstruction,
} from '../utils';

/**
 * Reduces:
 *
 * %t{0}: int*2B = lea abc{0}: int[4]*2B
 * %t{1}: int*2B = %t{0}: int*2B plus %14: int2B
 * *(%t{1}: int*2B) = store %255: int2B
 *
 * to
 *
 * *(%t{1}: int*2B + 14) = store %255: int2B
 */
export function foldAddressOffsetsInstructions(instructions: IRInstruction[]) {
  const newInstructions = [...instructions];
  let leaInstructions: Record<string, IRLeaInstruction> = {};

  for (let i = 0; i < newInstructions.length; ++i) {
    const instruction = newInstructions[i];

    if (isIRBranchInstruction(instruction)) {
      leaInstructions = {};
      continue;
    }

    if (isIRLeaInstruction(instruction)) {
      leaInstructions[instruction.outputVar.name] = instruction;
      continue;
    }

    if (!isIRStoreInstruction(instruction)) {
      continue;
    }

    for (let j = i - 1; j >= 0; --j) {
      const prevInstruction = newInstructions[j];

      if (
        !isIRMathInstruction(prevInstruction) ||
        !prevInstruction.outputVar.isShallowEqual(instruction.outputVar) ||
        !isIRVariable(prevInstruction.leftVar) ||
        !leaInstructions[prevInstruction.leftVar.name]
      ) {
        continue;
      }

      const mathInstruction = prevInstruction
        .tryFlipConstantsToRight()
        .unwrapOr<IRMathInstruction>(null);

      if (!mathInstruction) {
        continue;
      }

      const evalResult = tryEvalConstArgsBinaryInstruction({
        operator: mathInstruction.operator,
        leftVar: IRConstant.ofConstant(mathInstruction.leftVar.type, 0x0),
        rightVar: mathInstruction.rightVar,
      }).unwrapOr<null>(null);

      if (isNil(evalResult)) {
        break;
      }

      newInstructions[i] = instruction.ofOffset(
        instruction.offset + evalResult,
      );

      newInstructions.splice(j, 1);
      --i;

      // replace these t{1} vars after optimizing t{0}, t{1} is equal t{0}
      // %t{0}: int*2B = lea abc{0}: int[4]*2B
      // *(%t{0}: int*2B) = store %3: int2B
      // *(%t{1}: int*2B + %4) = store %6: int2B
      const replacedOutputs = {
        [mathInstruction.outputVar.name]:
          leaInstructions[prevInstruction.leftVar.name].outputVar,
      };

      for (let k = i; k < newInstructions.length; ++k) {
        const optimizedInstruction = dropConstantInstructionArgs(
          replacedOutputs,
          newInstructions[k],
        );

        if (optimizedInstruction) {
          newInstructions[k] = optimizedInstruction;
        }
      }

      break;
    }
  }

  return newInstructions;
}
