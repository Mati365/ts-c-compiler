import chalk from 'chalk';

import { IsOutputInstruction } from '../interfaces';
import { IROpcode } from '../constants';
import { IRInstruction, IRInstructionArgs } from './IRInstruction';
import { IRVariable } from '../variables';

export function isIRPhiInstruction(
  instruction: IRInstruction,
): instruction is IRPhiInstruction {
  return instruction.opcode === IROpcode.PHI;
}

/**
 * PHI instruction
 */
export class IRPhiInstruction extends IRInstruction implements IsOutputInstruction {
  constructor(
    readonly vars: IRVariable[],
    readonly outputVar: IRVariable,
  ) {
    super(IROpcode.PHI);
  }

  override ofArgs({ input = this.vars, output = this.outputVar }: IRInstructionArgs) {
    return new IRPhiInstruction(input as IRVariable[], output);
  }

  override getArgs(): IRInstructionArgs {
    const { vars, outputVar } = this;

    return {
      input: vars,
      output: outputVar,
    };
  }

  override getDisplayName(): string {
    const { outputVar, vars } = this;
    const argsStr = vars.map(v => v.getDisplayName()).join(', ');

    return `${outputVar.getDisplayName()} = ${chalk.greenBright('φ(')}${argsStr}${chalk.greenBright(')')}`;
  }
}
