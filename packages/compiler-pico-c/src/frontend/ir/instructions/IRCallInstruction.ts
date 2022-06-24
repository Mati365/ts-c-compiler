import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';
import {IROpcode} from '../constants';
import {IRInstruction, IRInstructionArgs} from './IRInstruction';
import {IRVariable, IRInstructionVarArg} from '../variables';

export function isIRCallInstruction(instruction: IRInstruction): instruction is IRCallInstruction {
  return instruction?.opcode === IROpcode.CALL;
}

/**
 * Instruction that performs jmp to function
 *
 * @export
 * @class IRCallInstruction
 * @extends {IRInstruction}
 * @implements {IsOutputInstruction}
 */
export class IRCallInstruction extends IRInstruction implements IsOutputInstruction {
  constructor(
    readonly fnPtr: IRVariable,
    readonly args: IRInstructionVarArg[],
    readonly outputVar?: IRVariable,
  ) {
    super(IROpcode.CALL);
  }

  override ofArgs(
    {
      input: [fnPtr, ...restInput],
      output = this.outputVar,
    }: IRInstructionArgs,
  ) {
    return new IRCallInstruction(<IRVariable> fnPtr, restInput, output);
  }

  override getArgs(): IRInstructionArgs {
    return {
      input: [this.fnPtr, ...this.args],
      output: this.outputVar,
    };
  }

  override getDisplayName(): string {
    const {
      fnPtr,
      args,
      outputVar,
    } = this;

    const argsStr = args.map((arg) => arg.getDisplayName()).join(', ');
    const str = `${chalk.magentaBright('call')} ${fnPtr.getDisplayName()} :: (${argsStr})`;

    if (outputVar)
      return `${outputVar.getDisplayName()} = ${str}`;

    return str;
  }
}
