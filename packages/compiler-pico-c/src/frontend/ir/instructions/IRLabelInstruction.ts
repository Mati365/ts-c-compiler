import chalk from 'chalk';

import {IROpcode} from '../constants';
import {IRInstruction} from './IRInstruction';
import {IsLabeledInstruction} from '../interfaces/IsLabeledInstruction';

export function isIRLabelInstruction(instruction: IRInstruction): instruction is IRLabelInstruction {
  return instruction.opcode === IROpcode.LABEL;
}

/**
 * Label instruction
 *
 * @export
 * @class IRLabelInstruction
 * @extends {IRInstruction}
 */
export class IRLabelInstruction extends IRInstruction implements IsLabeledInstruction {
  constructor(readonly name: string) {
    super(IROpcode.LABEL);
  }

  override getDisplayName(): string {
    return chalk.white.bold(`${this.name}:`);
  }
}
