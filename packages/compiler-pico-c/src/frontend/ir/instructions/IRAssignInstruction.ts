import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';
import {IROpcode} from '../constants';
import {IRInstruction, IRInstructionArgs} from './IRInstruction';
import {IRInstructionVarArg, IRVariable} from '../variables';

export function isIRAssignInstruction(instruction: IRInstruction): instruction is IRAssignInstruction {
  return instruction.opcode === IROpcode.ASSIGN;
}

/**
 * Instruction that assigns variable to tmp ir var
 *
 * @export
 * @class IRAssignInstruction
 * @extends {IRInstruction}
 * @implements {IsOutputInstruction}
 */
export class IRAssignInstruction extends IRInstruction implements IsOutputInstruction {
  constructor(
    readonly inputVar: IRInstructionVarArg,
    readonly outputVar: IRVariable,
  ) {
    super(IROpcode.ASSIGN);
  }

  override ofArgs(
    {
      input = [this.inputVar],
      output = this.outputVar,
    }: IRInstructionArgs,
  ) {
    return new IRAssignInstruction(input[0], output);
  }

  override getArgs(): IRInstructionArgs {
    const {inputVar, outputVar} = this;

    return {
      input: [inputVar],
      output: outputVar,
    };
  }

  override getDisplayName(): string {
    const {outputVar, inputVar} = this;

    return `${outputVar.getDisplayName()} = ${chalk.yellowBright('assign')} ${inputVar.getDisplayName()}`;
  }
}
