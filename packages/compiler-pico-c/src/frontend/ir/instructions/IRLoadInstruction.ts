import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';
import {IROpcode} from '../constants';
import {IRInstruction} from './IRInstruction';
import {IRInstructionVarArg, IRVariable} from '../variables';

/**
 * Instruction that loads variable from mem
 *
 * @export
 * @class IRLoadInstruction
 * @extends {IRInstruction}
 * @implements {IsOutputInstruction}
 */
export class IRLoadInstruction extends IRInstruction implements IsOutputInstruction {
  constructor(
    readonly inputVar: IRInstructionVarArg,
    readonly outputVar: IRVariable,
    readonly offset: number = 0,
  ) {
    super(IROpcode.LOAD);
  }

  override getDisplayName(): string {
    const {outputVar, inputVar, offset} = this;
    const offsetSuffix = offset ? ` + ${offset}` : '';

    return (
      `${outputVar.getDisplayName()} = ${chalk.yellowBright('load')} ${inputVar.getDisplayName()}${offsetSuffix}`
    );
  }
}
