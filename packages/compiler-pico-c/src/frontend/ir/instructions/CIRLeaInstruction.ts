import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';
import {CIROpcode} from '../constants';
import {CIRInstruction} from './CIRInstruction';
import {CIRInstructionVarArg, CIRVariable} from '../variables';

/**
 * Instruction that loads mem address of variable
 *
 * @export
 * @class CIRLeaInstruction
 * @extends {CIRInstruction}
 * @implements {IsOutputInstruction}
 */
export class CIRLeaInstruction extends CIRInstruction implements IsOutputInstruction {
  constructor(
    readonly outputVar: CIRVariable,
    readonly inputVar: CIRInstructionVarArg,
  ) {
    super(CIROpcode.LEA);
  }

  override getDisplayName(): string {
    const {outputVar, inputVar} = this;

    return `${outputVar.getDisplayName(false)} = ${chalk.yellowBright('lea')} ${inputVar.getDisplayName()}`;
  }
}
