import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';
import {IROpcode} from '../constants';
import {IRInstruction} from './IRInstruction';
import {IRInstructionVarArg, IRVariable} from '../variables';

/**
 * Instruction that loads mem address of variable
 *
 * @export
 * @class IRLeaInstruction
 * @extends {IRInstruction}
 * @implements {IsOutputInstruction}
 */
export class IRLeaInstruction extends IRInstruction implements IsOutputInstruction {
  constructor(
    readonly inputVar: IRInstructionVarArg,
    readonly outputVar: IRVariable,
  ) {
    super(IROpcode.LEA);
  }

  override getDisplayName(): string {
    const {outputVar, inputVar} = this;

    return `${outputVar.getDisplayName()} = ${chalk.yellowBright('lea')} ${inputVar.getDisplayName()}`;
  }
}
