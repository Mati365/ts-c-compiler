import {
  IRAssignInstruction,
  IRInstruction,
  IRLeaInstruction,
  isIRAssignInstruction,
  isIRLeaInstruction,
  isIRPhiInstruction,
} from '../../../instructions';

/**
 * Sometimes after optimizations some of phi variables remain unassigned.
 * Force assign them again.
 */
export function reassignPhiInstructions(instructions: IRInstruction[]) {
  const newInstructions = [...instructions];
  const assigns: Record<string, IRAssignInstruction | IRLeaInstruction> = {};

  for (let i = 0; i < newInstructions.length; ++i) {
    const instruction = newInstructions[i];

    if (isIRAssignInstruction(instruction) || isIRLeaInstruction(instruction)) {
      assigns[instruction.outputVar.name] = instruction;
    } else if (isIRPhiInstruction(instruction)) {
      for (const argVar of instruction.vars) {
        assigns[argVar.name].meta.phi = instruction;
      }
    }
  }

  return newInstructions;
}
