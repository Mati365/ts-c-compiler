import {
  IRInstruction,
  isIRCallInstruction,
  isIRIfInstruction,
  isIRJmpInstruction,
  isIRLabelInstruction,
  isIRRetInstruction,
} from '../instructions';

export function isIRBranchInstruction(instruction: IRInstruction): boolean {
  return (
    isIRCallInstruction(instruction)
      || isIRJmpInstruction(instruction)
      || isIRRetInstruction(instruction)
      || isIRIfInstruction(instruction)
      || isIRLabelInstruction(instruction)
  );
}
