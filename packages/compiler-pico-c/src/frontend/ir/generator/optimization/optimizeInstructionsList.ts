import {
  IRAssignInstruction,
  IRInstruction,
  IRMathInstruction,
  IRStoreInstruction,
  isIRAssignInstruction,
  isIRMathInstruction,
  isIRStoreInstruction,
} from '../../instructions';

import {IRConstant, isIRConstant, isIRVariable} from '../../variables';

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
  instructions: IRInstruction[],
  {
    enabled = true,
  }: IRInstructionsOptimizationAttrs = {},
) {
  if (!enabled)
    return instructions;

  const newInstructions = [...instructions];
  const constantArgs: Record<string, IRConstant> = {};

  for (let i = 0; i < newInstructions.length;) {
    const instruction = newInstructions[i];

    // remove constant assigns from code
    if (isIRAssignInstruction(instruction) && isIRConstant(instruction.inputVar)) {
      constantArgs[instruction.outputVar.name] = instruction.inputVar;
      newInstructions.splice(i, 1);
      --i;
      continue;
    }

    // replace constants in store instruction
    if (isIRStoreInstruction(instruction)
        && isIRVariable(instruction.value)
        && instruction.value.name in constantArgs) {
      newInstructions[i] = (
        new IRStoreInstruction(
          IRConstant.ofConstant(
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
      const {
        operator,
        leftVar,
        rightVar,
        outputVar,
      } = instruction;

      let newInstruction: IRInstruction;
      if (isIRVariable(leftVar) && leftVar.name in constantArgs) {
        newInstruction = (
          new IRMathInstruction(
            operator,
            constantArgs[leftVar.name],
            rightVar,
            outputVar,
          )
        );
      } else if (isIRVariable(rightVar) && rightVar.name in constantArgs) {
        newInstruction = (
          new IRMathInstruction(
            operator,
            leftVar,
            constantArgs[rightVar.name],
            outputVar,
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
        newInstructions[i] = new IRAssignInstruction(
          IRConstant.ofConstant(
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
