import chalk from 'chalk';

import {
  ASTCAsmStmtInputConstraint,
  ASTCAsmStmtOutputConstraint,
} from '../../parser';

import { IROpcode } from '../constants';
import { IRInstructionArg } from '../variables';
import { IRInstruction, IRInstructionArgs } from './IRInstruction';

export function isIRAsmInstruction(
  instruction: IRInstruction,
): instruction is IRAsmInstruction {
  return instruction.opcode === IROpcode.ASM;
}

type IROperand<C> = {
  [symbolicName: string]: {
    constraint: C;
    irVar: IRInstructionArg;
  };
};

export type IRAsmInputOperands = IROperand<ASTCAsmStmtInputConstraint>;
export type IRAsmOutputOperands = IROperand<ASTCAsmStmtOutputConstraint>;

/**
 * ASM instruction
 */
export class IRAsmInstruction extends IRInstruction {
  constructor(
    readonly expression: string,
    readonly outputOperands: IRAsmOutputOperands = {},
    readonly inputOperands: IRAsmInputOperands = {},
  ) {
    super(IROpcode.ASM);
  }

  override getArgs(): IRInstructionArgs {
    const { inputOperands } = this;

    return {
      output: null,
      input: Object.values(inputOperands).map(({ irVar }) => irVar),
    };
  }

  override getDisplayName(): string {
    return `${chalk.bold.magentaBright('asm')} ${chalk.blueBright(
      `"${this.expression}"`,
    )}`;
  }
}
