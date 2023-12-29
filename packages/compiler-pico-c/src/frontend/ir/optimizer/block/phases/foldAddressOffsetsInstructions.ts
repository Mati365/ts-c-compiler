import { isNil } from 'ramda';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';

import { isIRBranchInstruction } from '../../../guards';
import {
  IRInstruction,
  IRLeaInstruction,
  isIRLeaInstruction,
  isIRMathInstruction,
  isIRStoreInstruction,
} from '../../../instructions';

import { IRConstant, isIRVariable } from '../../../variables';
import {
  dropConstantInstructionArgs,
  tryEvalConstArgsBinaryInstruction,
} from '../utils';
import { getBaseTypeIfPtr } from 'frontend/analyze/types/utils';

/**
 * Reduces:
 *
 * %t{0}: int*2B = lea abc{0}: int[4]*2B
 * %t{1}: int*2B = %t{0}: int*2B plus %14: int2B
 * *(%t{1}: int*2B) = store %255: int2B
 *
 * to
 *
 * *(%t{0}: int*2B + 14) = store %255: int2B
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

    // check if previous instruction is lea
    for (let j = i - 1; j >= 0; --j) {
      const prevInstruction = newInstructions[j];

      if (
        isIRLeaInstruction(prevInstruction) &&
        prevInstruction.outputVar.isShallowEqual(instruction.outputVar)
      ) {
        newInstructions[i] = instruction.ofArgs({
          ...instruction.getArgs(),
          output: getBaseTypeIfPtr(prevInstruction.inputVar.type).isUnion()
            ? prevInstruction.inputVar.ofType(instruction.outputVar.type)
            : prevInstruction.inputVar,
        });

        break;
      }
    }

    // lookup for previous math instructions, evaluate constants offsets
    for (let j = i - 1; j >= 0; --j) {
      const prevInstruction = newInstructions[j];

      if (
        !isIRMathInstruction(prevInstruction) ||
        !prevInstruction.outputVar.isShallowEqual(instruction.outputVar) ||
        !isIRVariable(prevInstruction.leftVar)
      ) {
        continue;
      }

      const leaInstruction = leaInstructions[prevInstruction.leftVar.name];
      if (!leaInstruction) {
        continue;
      }

      const mathInstruction = pipe(
        prevInstruction.tryFlipConstantsToRight(),
        O.toNullable,
      );

      if (!mathInstruction) {
        continue;
      }

      const evalResult = pipe(
        tryEvalConstArgsBinaryInstruction({
          operator: mathInstruction.operator,
          leftVar: IRConstant.ofConstant(mathInstruction.leftVar.type, 0x0),
          rightVar: mathInstruction.rightVar,
        }),
        O.toNullable,
      );

      if (isNil(evalResult)) {
        break;
      }

      // edge case for unions, it is impossible to deduce type of assigned
      // value based on offset so force use last operator type
      const isUnion = getBaseTypeIfPtr(leaInstruction.inputVar.type).isUnion();

      newInstructions[i] = instruction
        .ofOffset(instruction.offset + evalResult)
        .ofArgs({
          ...instruction.getArgs(),
          output: isUnion
            ? leaInstruction.inputVar.ofType(mathInstruction.outputVar.type)
            : leaInstruction.inputVar,
        });

      const replacedOutputs = {
        [mathInstruction.outputVar.name]: leaInstruction.inputVar,
      };

      // replace these t{1} vars after optimizing t{0}, t{1} is equal t{0}
      // %t{0}: int*2B = lea abc{0}: int[4]*2B
      // *(%t{0}: int*2B) = store %3: int2B
      // *(%t{1}: int*2B + %4) = store %6: int2B
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
