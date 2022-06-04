import * as R from 'ramda';
import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';

import {CIROpcode} from '../constants';
import {CIRInstruction} from './CIRInstruction';
import {CIRInstructionVarArg, CIRVariable} from '../variables';

export function isIRStoreInstruction(instruction: CIRInstruction): instruction is CIRStoreInstruction {
  return instruction.opcode === CIROpcode.STORE;
}

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
    readonly outputVar: CIRVariable,
    readonly offset: number = 0,
  ) {
    super(CIROpcode.STORE);
  }

  isUninitialized() {
    return R.isNil(this.value);
  }

  override getDisplayName(): string {
    const {outputVar, value, offset} = this;
    const offsetSuffix = offset ? ` + %${chalk.greenBright(offset)}` : '';

    return `*(${outputVar.getDisplayName(false)}${offsetSuffix}) = ${value?.getDisplayName() ?? '<uninitialized>'}`;
  }
}
