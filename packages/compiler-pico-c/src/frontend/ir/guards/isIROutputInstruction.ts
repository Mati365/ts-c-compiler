import { IRInstruction } from '../instructions';
import { IsOutputInstruction } from '../interfaces';

export function isIROutputInstruction(
  instruction: IRInstruction,
): instruction is IsOutputInstruction {
  return instruction && 'outputVar' in instruction;
}
