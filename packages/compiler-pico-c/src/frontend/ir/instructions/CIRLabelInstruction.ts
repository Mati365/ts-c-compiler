import {CIROpcode} from '../constants';
import {CIRInstruction} from './CIRInstruction/CIRInstruction';

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
export class CIRLabelInstruction extends CIRInstruction {
  constructor(readonly name: string) {
    super(CIROpcode.LABEL);
  }

  override getDisplayName(): string {
    return `${this.name}:`;
  }
}
