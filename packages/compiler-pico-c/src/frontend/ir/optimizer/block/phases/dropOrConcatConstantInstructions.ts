import * as O from 'fp-ts/Option';

import {
  IRAssignInstruction,
  IRInstruction,
  IRStoreInstruction,
  isIRAssignInstruction,
  isIRMathInstruction,
  isIRStoreInstruction,
} from '../../../instructions';

import { IRConstant, isIRConstant, isIRVariable } from '../../../variables';

import { dropConstantInstructionArgs } from '../utils/dropConstantInstructionArgs';
import { tryConcatMathInstructions } from '../utils/tryConcatMathInstructions';
import { tryEvalConstArgsBinaryInstruction } from '../utils/tryEvalConstArgsBinaryInstruction';

/**
 * Optimizes instructions list by eliminate const expr.
 *
 * - Removes constant ASSIGN
 * - Folds temp constant variables in store instruction
 * - Evaluate math expressions
 */
export function dropOrConcatConstantInstructions(
  instructions: IRInstruction[],
) {
  const newInstructions = [...instructions];
  const constantArgs: Record<string, IRConstant> = {};
  let totalConstants = 0;

  for (let i = 0; i < newInstructions.length; ) {
    const instruction = newInstructions[i];

    if (totalConstants) {
      const optimizedInstruction = dropConstantInstructionArgs(
        constantArgs,
        instruction,
      );

      if (optimizedInstruction) {
        newInstructions[i] = optimizedInstruction;
        continue;
      }
    }

    // remove constant assigns from code
    if (
      isIRAssignInstruction(instruction) &&
      instruction.meta.virtual &&
      isIRConstant(instruction.inputVar)
    ) {
      constantArgs[instruction.outputVar.name] = instruction.inputVar;
      newInstructions.splice(i, 1);
      ++totalConstants;
      --i;
      continue;
    }

    // replace constants in store instruction
    if (
      isIRStoreInstruction(instruction) &&
      isIRVariable(instruction.value) &&
      instruction.value.name in constantArgs
    ) {
      newInstructions[i] = new IRStoreInstruction(
        IRConstant.ofConstant(
          instruction.value.type,
          constantArgs[instruction.value.name].constant,
        ),
        instruction.outputVar,
      );
      continue;
    }

    // compile time calc
    if (isIRMathInstruction(instruction)) {
      const evalResult = tryEvalConstArgsBinaryInstruction(instruction);

      if (O.isSome(evalResult)) {
        newInstructions[i] = new IRAssignInstruction(
          IRConstant.ofConstant(instruction.leftVar.type, evalResult.value),
          instruction.outputVar,
          {
            virtual: true,
          },
        );

        continue;
      }
    }

    const concatedInstruction = tryConcatMathInstructions({
      a: newInstructions[i - 1],
      b: instruction,
    });

    if (O.isSome(concatedInstruction)) {
      newInstructions[i - 1] = concatedInstruction.value;
      newInstructions.splice(i, 1);
      --i;
    } else {
      ++i;
    }
  }

  return newInstructions;
}
