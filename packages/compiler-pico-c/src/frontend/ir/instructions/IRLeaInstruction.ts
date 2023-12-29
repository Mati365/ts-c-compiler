import chalk from 'chalk';

import { IsOutputInstruction } from '../interfaces';
import { IROpcode } from '../constants';
import { IRInstruction, IRInstructionArgs } from './IRInstruction';
import { IRVariable } from '../variables';

export function isIRLeaInstruction(
  instruction: IRInstruction,
): instruction is IRLeaInstruction {
  return instruction?.opcode === IROpcode.LEA;
}

/**
 * Instruction that loads mem address of variable
 */
export class IRLeaInstruction
  extends IRInstruction
  implements IsOutputInstruction
{
  constructor(public inputVar: IRVariable, public outputVar: IRVariable) {
    super(IROpcode.LEA);
  }

  override ofArgs({
    input = [this.inputVar],
    output = this.outputVar,
  }: IRInstructionArgs) {
    return new IRLeaInstruction(<IRVariable>input[0], output);
  }

  override getArgs(): IRInstructionArgs {
    const { inputVar, outputVar } = this;

    return {
      input: [inputVar],
      output: outputVar,
    };
  }

  override getDisplayName(): string {
    const { outputVar, inputVar } = this;

    return `${outputVar.getDisplayName()} = ${chalk.yellowBright(
      'lea',
    )} ${inputVar.getDisplayName()}`;
  }
}
