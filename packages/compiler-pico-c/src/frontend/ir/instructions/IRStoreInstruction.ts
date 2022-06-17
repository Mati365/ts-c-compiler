import * as R from 'ramda';
import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';

import {IROpcode} from '../constants';
import {IRInstruction, IRInstructionArgs} from './IRInstruction';
import {IRInstructionVarArg, IRVariable} from '../variables';

export function isIRStoreInstruction(instruction: IRInstruction): instruction is IRStoreInstruction {
  return instruction.opcode === IROpcode.STORE;
}

/**
 * Instruction that saves variable to mem
 *
 * @export
 * @class IRStoreInstruction
 * @extends {IRInstruction}
 * @implements {IsOutputInstruction}
 */
export class IRStoreInstruction extends IRInstruction implements IsOutputInstruction {
  constructor(
    readonly value: IRInstructionVarArg,
    readonly outputVar: IRVariable,
    readonly offset: number = 0,
  ) {
    super(IROpcode.STORE);
  }

  isUninitialized() {
    return R.isNil(this.value);
  }

  override ofArgs(
    {
      input = [this.value],
      output = this.outputVar,
    }: IRInstructionArgs,
  ) {
    return new IRStoreInstruction(
      <IRVariable> input[0],
      output,
      this.offset,
    );
  }

  override getArgs(): IRInstructionArgs {
    const {value, outputVar} = this;

    return {
      input: [value],
      output: outputVar,
    };
  }

  override getDisplayName(): string {
    const {outputVar, value, offset} = this;
    const offsetSuffix = offset ? ` + %${chalk.greenBright(offset)}` : '';

    return (
      // eslint-disable-next-line max-len
      `*(${outputVar.getDisplayName()}${offsetSuffix}) = ${chalk.yellowBright('store')} ${value?.getDisplayName() ?? '<uninitialized>'}`
    );
  }
}
