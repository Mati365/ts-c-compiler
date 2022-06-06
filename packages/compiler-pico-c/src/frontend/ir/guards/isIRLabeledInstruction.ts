import {IRInstruction} from '../instructions';
import {IsLabeledInstruction} from '../interfaces';

export function isIRLabeledInstruction(instruction: IRInstruction): instruction is IsLabeledInstruction {
  return 'name' in instruction;
}
