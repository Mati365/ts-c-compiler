import {
  IRInstruction,
  isIRBrInstruction,
  isIRLabelInstruction,
} from '../../../instructions';

/**
 * Drops branch jmps that have 0 instances.
 *
 *  br %t{3}: i1:zf, true: L2, false: L1
 *  L2:
 *  asm "xchg bx, bx"
 *  L1:
 *
 * In this case `true` is not needed
 */
export function dropUselessBranchInstructions(instructions: IRInstruction[]) {
  const newInstructions = [...instructions];

  for (let i = 0; i < newInstructions.length; ++i) {
    const instruction = newInstructions[i];
    const nextInstruction = newInstructions[i + 1];

    if (
      isIRBrInstruction(instruction) &&
      isIRLabelInstruction(nextInstruction) &&
      instruction.ifFalse &&
      instruction.ifTrue
    ) {
      if (instruction.ifFalse.name === nextInstruction.name) {
        instruction.ifFalse = null;
      } else if (instruction.ifTrue.name === nextInstruction.name) {
        instruction.ifTrue = null;
      }
    }
  }

  return newInstructions;
}
