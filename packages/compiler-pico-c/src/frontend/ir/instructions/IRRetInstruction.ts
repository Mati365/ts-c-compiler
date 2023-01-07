import chalk from 'chalk';
import * as R from 'ramda';

import { IROpcode } from '../constants';
import { IRInstructionVarArg } from '../variables';
import { IRInstruction, IRInstructionArgs } from './IRInstruction';

export function isIRRetInstruction(
  instruction: IRInstruction,
): instruction is IRRetInstruction {
  return instruction?.opcode === IROpcode.RET;
}

/**
 * IR return instruction
 */
export class IRRetInstruction extends IRInstruction {
  constructor(readonly value?: IRInstructionVarArg) {
    super(IROpcode.RET);
  }

  isVoid() {
    return R.isNil(this.value);
  }

  override ofArgs({ input = [this.value] }: IRInstructionArgs) {
    return new IRRetInstruction(input[0]);
  }

  override getArgs(): IRInstructionArgs {
    const { value } = this;

    return {
      input: this.isVoid() ? [] : [value],
    };
  }

  override getDisplayName(): string {
    const { value } = this;

    return `${chalk.magentaBright.bold('ret')} ${
      value?.getDisplayName() || ''
    }`.trim();
  }
}
