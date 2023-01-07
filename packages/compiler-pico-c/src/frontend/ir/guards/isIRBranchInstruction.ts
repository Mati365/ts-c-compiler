import {
  IRInstruction,
  isIRCallInstruction,
  isIRBrInstruction,
  isIRJmpInstruction,
  isIRLabelInstruction,
  isIRRetInstruction,
} from '../instructions';

export function isIRBranchInstruction(instruction: IRInstruction): boolean {
  return (
    isIRCallInstruction(instruction) ||
    isIRJmpInstruction(instruction) ||
    isIRRetInstruction(instruction) ||
    isIRBrInstruction(instruction) ||
    isIRLabelInstruction(instruction)
  );
}
