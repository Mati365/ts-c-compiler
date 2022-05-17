import * as R from 'ramda';

import {IsOutputInstruction} from '../interfaces';

import {CIROpcode} from '../constants';
import {CIRInstruction} from './CIRInstruction';
import {CIRInstructionVarArg} from '../variables';

/**
 * Instruction that creates variable with value
 *
 * @export
 * @class CIRInitInstruction
 * @extends {CIRInstruction}
 * @implements {IsOutputInstruction}
 */
export class CIRInitInstruction extends CIRInstruction implements IsOutputInstruction {
  constructor(
    readonly value: CIRInstructionVarArg,
    readonly outputVar: string,
  ) {
    super(CIROpcode.INIT);
  }

  isUninitialized() {
    return R.isNil(this.value);
  }

  override getDisplayName(): string {
    const {outputVar, value} = this;

    return `${outputVar} = ${value.getDisplayName()}`;
  }
}
