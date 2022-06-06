import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';

import {IROpcode} from '../constants';
import {IRInstruction} from './IRInstruction';
import {IRVariable} from '../variables/IRVariable';

export function isIRAllocInstruction(instruction: IRInstruction): instruction is IRAllocInstruction {
  return instruction.opcode === IROpcode.ALLOC;
}

/**
 * Allocs nth bytes for variable
 *
 * @export
 * @class IRAllocInstruction
 * @extends {IRInstruction}
 * @implements {IsOutputInstruction}
 */
export class IRAllocInstruction extends IRInstruction implements IsOutputInstruction {
  constructor(
    readonly outputVar: IRVariable,
  ) {
    super(IROpcode.ALLOC);
  }

  get type() {
    return this.outputVar.type;
  }

  override getDisplayName(): string {
    const {outputVar} = this;

    return `${chalk.magentaBright('alloc')} ${outputVar.getDisplayName()}`;
  }
}
