import * as R from 'ramda';
import chalk from 'chalk';

import { IsOutputInstruction } from '../interfaces';

import { IROpcode } from '../constants';
import { IRInstruction, IRInstructionArgs } from './IRInstruction';
import { IRInstructionTypedArg, IRVariable } from '../variables';

export function isIRStoreInstruction(
  instruction: IRInstruction,
): instruction is IRStoreInstruction {
  return instruction.opcode === IROpcode.STORE;
}

/**
 * Instead of `load` it performs only:
 *  1. Fetch address or reg
 *
 * It does not perform loading memory that can be specified by reg.
 */
export class IRStoreInstruction
  extends IRInstruction
  implements IsOutputInstruction
{
  constructor(
    readonly value: IRInstructionTypedArg,
    readonly outputVar: IRVariable,
    readonly offset: number = 0,
  ) {
    super(IROpcode.STORE);
  }

  isUninitialized() {
    return R.isNil(this.value);
  }

  ofOffset(newOffset: number = 0) {
    const { value, outputVar } = this;

    return new IRStoreInstruction(value, outputVar, newOffset);
  }

  override ofArgs({
    input = [this.value],
    output = this.outputVar,
  }: IRInstructionArgs) {
    return new IRStoreInstruction(<IRVariable>input[0], output, this.offset);
  }

  override getArgs(): IRInstructionArgs {
    const { value, outputVar } = this;

    return {
      input: [value],
      output: outputVar,
    };
  }

  override getDisplayName(): string {
    const { outputVar, value, offset } = this;
    const offsetSuffix = offset ? ` + %${chalk.greenBright(offset)}` : '';

    return (
      // eslint-disable-next-line max-len
      `*(${outputVar.getDisplayName()}${offsetSuffix}) = ${chalk.yellowBright(
        'store',
      )} ${value?.getDisplayName() ?? '<uninitialized>'}`
    );
  }
}
