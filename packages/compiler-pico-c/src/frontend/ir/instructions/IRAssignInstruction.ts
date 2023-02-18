import chalk from 'chalk';

import { IsOutputInstruction } from '../interfaces';
import { IROpcode } from '../constants';
import { IRInstruction, IRInstructionArgs } from './IRInstruction';
import { IRInstructionTypedArg, IRVariable } from '../variables';
import { IRPhiInstruction } from './IRPhiInstruction';

export type IRAssignMeta = {
  virtual?: boolean;
  phi?: IRPhiInstruction;
};

export function isIRAssignInstruction(
  instruction: IRInstruction,
): instruction is IRAssignInstruction {
  return instruction.opcode === IROpcode.ASSIGN;
}

/**
 * Instruction that assigns variable to tmp ir var.
 * Assign instruction used to set data to registers
 */
export class IRAssignInstruction
  extends IRInstruction
  implements IsOutputInstruction
{
  constructor(
    readonly inputVar: IRInstructionTypedArg,
    readonly outputVar: IRVariable,
    readonly meta: IRAssignMeta = {
      virtual: false,
    },
  ) {
    super(IROpcode.ASSIGN);
  }

  override ofArgs({
    input = [this.inputVar],
    output = this.outputVar,
  }: IRInstructionArgs) {
    return new IRAssignInstruction(<IRInstructionTypedArg>input[0], output);
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
      'assign',
    )} ${inputVar.getDisplayName()}`;
  }
}
