import chalk from 'chalk';

import { IROpcode } from '../constants';
import { IRInstruction } from './IRInstruction';
import { IsLabeledInstruction } from '../interfaces/IsLabeledInstruction';
import { IRPhiInstruction } from './IRPhiInstruction';

export function isIRLabelInstruction(
  instruction: IRInstruction,
): instruction is IRLabelInstruction {
  return instruction?.opcode === IROpcode.LABEL;
}

/**
 * Label instruction
 */
export class IRLabelInstruction
  extends IRInstruction
  implements IsLabeledInstruction
{
  constructor(
    readonly name: string,
    readonly phi?: IRPhiInstruction,
  ) {
    super(IROpcode.LABEL);
  }

  override getDisplayName(): string {
    return chalk.white.bold(`${this.name}:`);
  }

  getPhiPreservedArgs() {
    const { phi } = this;

    return phi ? phi.vars : [];
  }

  hasPhi() {
    return !!this.phi;
  }

  ofPhi(phi: IRPhiInstruction) {
    return new IRLabelInstruction(this.name, phi);
  }
}
