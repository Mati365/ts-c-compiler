import {
  CIRAssignInstruction,
  CIRInstruction,
  CIRMathInstruction,
  CIRStoreInstruction,
  isIRAssignInstruction,
  isIRMathInstruction,
  isIRStoreInstruction,
} from '../../instructions';

import {CIRConstant, isCIRConstant, isCIRVariable} from '../../variables';

import {tryConcatMathInstructions} from './tryConcatMathInstructions';
import {tryEvalConstArgsBinaryInstruction} from './tryEvalConstArgsBinaryInstruction';

export type IRInstructionsOptimizationAttrs = {
  enabled?: boolean;
};

/**
 * Optimizes instructions list by eliminate const expr.
 *
 * @see
 *  Input and output on first and last instructions must be preserved!
 */
export function optimizeInstructionsList(
  {
    enabled = true,
  }: IRInstructionsOptimizationAttrs,
  instructions: CIRInstruction[],
) {
  if (!enabled)
    return instructions;

  const newInstructions = [...instructions];
  const constantArgs: Record<string, CIRConstant> = {};

  for (let i = 0; i < newInstructions.length;) {
    const instruction = newInstructions[i];

    // remove constant assigns from code
    if (isIRAssignInstruction(instruction) && isCIRConstant(instruction.inputVar)) {
      constantArgs[instruction.outputVar.name] = instruction.inputVar;
      newInstructions.splice(i, 1);
      --i;
      continue;
    }

    // replace constants in store instruction
    if (isIRStoreInstruction(instruction)
        && isCIRVariable(instruction.value)
        && instruction.value.name in constantArgs) {
      newInstructions[i] = (
        new CIRStoreInstruction(
          CIRConstant.ofConstant(
            instruction.value.type,
            constantArgs[instruction.value.name].constant,
          ),
          instruction.outputVar,
        )
      );
      continue;
    }

    // try replace args with constant dumps
    if (isIRMathInstruction(instruction)) {
      let newInstruction: CIRInstruction;

      if (isCIRVariable(instruction.leftVar) && instruction.leftVar.name in constantArgs) {
        newInstruction = (
          new CIRMathInstruction(
            instruction.operator,
            constantArgs[instruction.leftVar.name],
            instruction.rightVar,
            instruction.outputVar,
          )
        );
      } else if (isCIRVariable(instruction.rightVar) && instruction.rightVar.name in constantArgs) {
        newInstruction = (
          new CIRMathInstruction(
            instruction.operator,
            instruction.leftVar,
            constantArgs[instruction.rightVar.name],
            instruction.outputVar,
          )
        );
      }

      if (newInstruction) {
        newInstructions[i] = newInstruction;
        --i;
        continue;
      }
    }

    // compile time calc
    if (isIRMathInstruction(instruction)) {
      const evalResult = tryEvalConstArgsBinaryInstruction(instruction);

      if (evalResult.isSome()) {
        newInstructions[i] = new CIRAssignInstruction(
          CIRConstant.ofConstant(
            instruction.leftVar.type,
            evalResult.unwrap(),
          ),
          instruction.outputVar,
        );

        continue;
      }
    }

    const concatedInstruction = tryConcatMathInstructions(
      {
        a: newInstructions[i - 1],
        b: instruction,
      },
    );

    if (concatedInstruction.isSome()) {
      newInstructions[i - 1] = concatedInstruction.unwrap();
      newInstructions.splice(i, 1);
      --i;
    } else
      ++i;
  }

  return newInstructions;
}
