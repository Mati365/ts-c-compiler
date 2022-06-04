import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';

import {CIROpcode} from '../constants';
import {CIRInstruction} from './CIRInstruction';
import {CIRVariable} from '../variables/CIRVariable';

export function isIRAllocInstruction(instruction: CIRInstruction): instruction is CIRAllocInstruction {
  return instruction.opcode === CIROpcode.ALLOC;
}

/**
 * Allocs nth bytes for variable
 *
 * @export
 * @class CIRAllocInstruction
 * @extends {CIRInstruction}
 * @implements {IsOutputInstruction}
 */
export class CIRAllocInstruction extends CIRInstruction implements IsOutputInstruction {
  constructor(
    readonly outputVar: CIRVariable,
  ) {
    super(CIROpcode.ALLOC);
  }

  get type() {
    return this.outputVar.type;
  }

  override getDisplayName(): string {
    const {outputVar} = this;

    return `${chalk.magentaBright('alloc')} ${outputVar.getDisplayName()}`;
  }
}
