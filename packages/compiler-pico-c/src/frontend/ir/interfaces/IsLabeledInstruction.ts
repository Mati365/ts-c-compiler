import type {CIRInstruction} from '../instructions/CIRInstruction';

export type IsLabeledInstruction = CIRInstruction & {
  name: string;
};

export function isIRLabeledInstruction(instruction: CIRInstruction): instruction is IsLabeledInstruction {
  return 'name' in instruction;
}
