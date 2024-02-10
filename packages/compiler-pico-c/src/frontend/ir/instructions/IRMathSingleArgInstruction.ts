import chalk from 'chalk';

import { CMathOperator } from '#constants';

import { IROpcode } from '../constants';
import { IRInstruction, IRInstructionArgs } from './IRInstruction';
import { IRInstructionTypedArg, IRVariable } from '../variables';

export function isIRSingleArgMathInstruction(
  instruction: IRInstruction,
): instruction is IRMathSingleArgInstruction {
  return !!instruction && instruction.opcode === IROpcode.MATH_SINGLE;
}

/**
 * Single argument math instruction
 */
export class IRMathSingleArgInstruction extends IRInstruction {
  constructor(
    readonly operator: CMathOperator,
    readonly leftVar: IRInstructionTypedArg,
    readonly outputVar: IRVariable,
  ) {
    super(IROpcode.MATH_SINGLE);
  }

  override ofArgs({
    input = [this.leftVar],
    output = this.outputVar,
  }: IRInstructionArgs) {
    const { operator } = this;

    return new IRMathSingleArgInstruction(operator, <IRVariable>input[0], output);
  }

  override getArgs(): IRInstructionArgs {
    return {
      input: [this.leftVar],
      output: this.outputVar,
    };
  }

  override getDisplayName(): string {
    const { outputVar, leftVar, operator } = this;

    return `${outputVar.getDisplayName()} = ${chalk.yellowBright(operator.toLowerCase())} ${leftVar.getDisplayName()}`;
  }
}
