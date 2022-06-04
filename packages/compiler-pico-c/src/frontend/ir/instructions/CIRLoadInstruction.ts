import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';
import {CIROpcode} from '../constants';
import {CIRInstruction} from './CIRInstruction';
import {CIRInstructionVarArg, CIRVariable} from '../variables';

/**
 * Instruction that loads variable from mem
 *
 * @export
 * @class CIRLoadInstruction
 * @extends {CIRInstruction}
 * @implements {IsOutputInstruction}
 */
export class CIRLoadInstruction extends CIRInstruction implements IsOutputInstruction {
  constructor(
    readonly inputVar: CIRInstructionVarArg,
    readonly outputVar: CIRVariable,
    readonly offset: number = 0,
  ) {
    super(CIROpcode.LOAD);
  }

  override getDisplayName(): string {
    const {outputVar, inputVar, offset} = this;
    const offsetSuffix = offset ? ` + ${offset}` : '';

    return (
      `${outputVar.getDisplayName(false)} = ${chalk.yellowBright('load')} ${inputVar.getDisplayName()}${offsetSuffix}`
    );
  }
}
