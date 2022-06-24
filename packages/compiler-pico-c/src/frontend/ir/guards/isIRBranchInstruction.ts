import {
  IRInstruction,
  isIRCallInstruction,
  isIRJmpInstruction,
  isIRRetInstruction,
} from '../instructions';

export function isIRBranchInstruction(instruction: IRInstruction): boolean {
  return (
    isIRCallInstruction(instruction)
      || isIRJmpInstruction(instruction)
      || isIRRetInstruction(instruction)
  );
}
