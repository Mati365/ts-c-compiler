import chalk from 'chalk';

import { IsOutputInstruction } from '../interfaces';
import { IROpcode } from '../constants';
import { IRInstruction, IRInstructionArgs } from './IRInstruction';
import { IRVariable } from '../variables';

export function isIRCastInstruction(
  instruction: IRInstruction,
): instruction is IRCastInstruction {
  return instruction?.opcode === IROpcode.CAST;
}

export class IRCastInstruction extends IRInstruction implements IsOutputInstruction {
  constructor(
    readonly inputVar: IRVariable,
    readonly outputVar: IRVariable,
    readonly offset: number = 0,
  ) {
    super(IROpcode.CAST);
  }

  override ofArgs({
    input = [this.inputVar],
    output = this.outputVar,
  }: IRInstructionArgs) {
    return new IRCastInstruction(<IRVariable>input[0], output);
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

    return `${outputVar.getDisplayName()} = ${chalk.yellowBright('cast')} ${inputVar.getDisplayName()}${offsetSuffix}`;
  }
}
