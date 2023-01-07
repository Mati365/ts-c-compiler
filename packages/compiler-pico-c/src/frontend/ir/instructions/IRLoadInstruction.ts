import chalk from 'chalk';

import { IsOutputInstruction } from '../interfaces';
import { IROpcode } from '../constants';
import { IRInstruction, IRInstructionArgs } from './IRInstruction';
import { IRInstructionVarArg, IRVariable } from '../variables';

export function isIRLoadInstruction(
  instruction: IRInstruction,
): instruction is IRLoadInstruction {
  return instruction?.opcode === IROpcode.LOAD;
}

/**
 * Instruction that loads variable from mem
 */
export class IRLoadInstruction
  extends IRInstruction
  implements IsOutputInstruction
{
  constructor(
    readonly inputVar: IRInstructionVarArg,
    readonly outputVar: IRVariable,
    readonly offset: number = 0,
  ) {
    super(IROpcode.LOAD);
  }

  override ofArgs({
    input = [this.inputVar],
    output = this.outputVar,
  }: IRInstructionArgs) {
    return new IRLoadInstruction(<IRVariable>input[0], output);
  }

  override getArgs(): IRInstructionArgs {
    const { inputVar, outputVar } = this;

    return {
      input: [inputVar],
      output: outputVar,
    };
  }

  override getDisplayName(): string {
    const { outputVar, inputVar, offset } = this;
    const offsetSuffix = offset ? ` + ${offset}` : '';

    return `${outputVar.getDisplayName()} = ${chalk.yellowBright(
      'load',
    )} ${inputVar.getDisplayName()}${offsetSuffix}`;
  }
}
