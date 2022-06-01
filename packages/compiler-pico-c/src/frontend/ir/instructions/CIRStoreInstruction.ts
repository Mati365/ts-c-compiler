import * as R from 'ramda';
import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';

import {CIROpcode} from '../constants';
import {CIRInstruction} from './CIRInstruction';
import {CIRInstructionVarArg} from '../variables';

/**
 * Instruction that saves variable to mem
 *
 * @export
 * @class CIRStoreInstruction
 * @extends {CIRInstruction}
 * @implements {IsOutputInstruction}
 */
export class CIRStoreInstruction extends CIRInstruction implements IsOutputInstruction {
  constructor(
    readonly value: CIRInstructionVarArg,
    readonly outputVar: string,
    readonly offset: number = 0,
  ) {
    super(CIROpcode.STORE);
  }

  isUninitialized() {
    return R.isNil(this.value);
  }

  override getDisplayName(): string {
    const {outputVar, value, offset} = this;
    const offsetSuffix = offset ? ` + ${offset}` : '';

    return `*(${chalk.blueBright(outputVar)}${offsetSuffix}) = ${value?.getDisplayName() ?? '<uninitialized>'}`;
  }
}
