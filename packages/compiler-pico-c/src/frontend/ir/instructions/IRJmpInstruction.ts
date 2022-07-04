import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';
import {IROpcode} from '../constants';
import {IRInstruction} from './IRInstruction';
import {IRLabelInstruction} from './IRLabelInstruction';

export function isIRJmpInstruction(instruction: IRInstruction): instruction is IRJmpInstruction {
  return instruction?.opcode === IROpcode.JMP;
}

/**
 * Instruction that performs branch
 *
 * @export
 * @class IRJmpInstruction
 * @extends {IRInstruction}
 * @implements {IsOutputInstruction}
 */
export class IRJmpInstruction extends IRInstruction implements IsOutputInstruction {
  constructor(
    readonly label: IRLabelInstruction,
  ) {
    super(IROpcode.JMP);
  }

  override getDisplayName(): string {
    return `${chalk.magentaBright('jmp')} ${this.label.getDisplayName()}`;
  }
}
