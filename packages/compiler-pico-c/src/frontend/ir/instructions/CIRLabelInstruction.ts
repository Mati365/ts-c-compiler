import {CIROpcode} from '../constants';
import {CIRInstruction} from './CIRInstruction';
import {IsLabeledInstruction} from '../interfaces/IsLabeledInstruction';

export function isIRLabelInstruction(instruction: CIRInstruction): instruction is CIRLabelInstruction {
  return instruction.opcode === CIROpcode.LABEL;
}

/**
 * Label instruction
 *
 * @export
 * @class CIRLabelInstruction
 * @extends {CIRInstruction}
 */
export class CIRLabelInstruction extends CIRInstruction implements IsLabeledInstruction {
  constructor(readonly name: string) {
    super(CIROpcode.LABEL);
  }

  override getDisplayName(): string {
    return `${this.name}:`;
  }
}
