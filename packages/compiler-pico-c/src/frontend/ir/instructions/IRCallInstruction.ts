import chalk from 'chalk';

import { IsOutputInstruction } from '../interfaces';
import { IROpcode } from '../constants';
import { IRInstruction, IRInstructionArgs } from './IRInstruction';
import { IRVariable, IRInstructionTypedArg, IRLabel } from '../variables';

export function isIRCallInstruction(
  instruction: IRInstruction,
): instruction is IRCallInstruction {
  return instruction?.opcode === IROpcode.CALL;
}

/**
 * Instruction that performs jmp to function
 */
export class IRCallInstruction
  extends IRInstruction
  implements IsOutputInstruction
{
  constructor(
    readonly fnPtr: IRVariable | IRLabel,
    readonly args: IRInstructionTypedArg[],
    readonly outputVar?: IRVariable,
  ) {
    super(IROpcode.CALL);
  }

  ofFnPtr(fnPtr: IRVariable | IRLabel) {
    return new IRCallInstruction(fnPtr, this.args, this.outputVar);
  }

  override ofArgs({
    input: [fnPtr, ...restInput],
    output = this.outputVar,
  }: IRInstructionArgs) {
    return new IRCallInstruction(
      <IRVariable>fnPtr,
      <IRInstructionTypedArg[]>restInput,
      output,
    );
  }

  override getArgs(): IRInstructionArgs {
    return {
      input: [this.fnPtr, ...this.args],
      output: this.outputVar,
    };
  }

  override getDisplayName(): string {
    const { fnPtr, args, outputVar } = this;

    const argsStr = args.map(arg => arg?.getDisplayName()).join(', ');
    const str = `${chalk.magentaBright(
      'call',
    )} ${fnPtr.getDisplayName()} :: (${argsStr})`;

    if (outputVar) {
      return `${outputVar.getDisplayName()} = ${str}`;
    }

    return str;
  }
}
