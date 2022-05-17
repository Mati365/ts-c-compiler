import {CIRInstruction} from '../instructions';
import {IsLabeledInstruction} from '../interfaces';

export function isIRLabeledInstruction(instruction: CIRInstruction): instruction is IsLabeledInstruction {
  return 'name' in instruction;
}
