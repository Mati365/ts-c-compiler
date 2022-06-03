import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';
import {CIROpcode} from '../constants';
import {CIRInstruction} from './CIRInstruction';
import {CIRInstructionVarArg} from '../variables';

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
    readonly outputVar: string,
    readonly inputVar: CIRInstructionVarArg,
  ) {
    super(CIROpcode.LEA);
  }

  override getDisplayName(): string {
    const {outputVar, inputVar} = this;

    return `${chalk.blueBright(outputVar)} = ${chalk.yellowBright('lea')} ${inputVar.getDisplayName()}`;
  }
}
