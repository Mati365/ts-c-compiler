import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';
import {IROpcode} from '../constants';
import {IRInstruction, IRInstructionArgs} from './IRInstruction';
import {IRVariable, IRInstructionVarArg} from '../variables';

export function isIRJmpInstruction(instruction: IRInstruction): instruction is IRJmpInstruction {
  return instruction?.opcode === IROpcode.JMP;
}

/**
 * Instruction that performs branch
 *
 * @export
 * @class IRJmpInstruction
 * @extends {IRInstruction}
 * @implements {IsOutputInstruction}
 */
export class IRJmpInstruction extends IRInstruction implements IsOutputInstruction {
  constructor(
    readonly fnPtr: IRVariable,
    readonly input: IRInstructionVarArg,
  ) {
    super(IROpcode.JMP);
  }

  override ofArgs(
    {
      input,
    }: IRInstructionArgs,
  ) {
    const {fnPtr} = this;

    return new IRJmpInstruction(fnPtr, input[0]);
  }

  override getArgs(): IRInstructionArgs {
    return {
      input: [this.input],
    };
  }

  override getDisplayName(): string {
    const {input} = this;
    return `${chalk.magentaBright('jmp')} ${input.getDisplayName()}`;
  }
}
