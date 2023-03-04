import chalk from 'chalk';

import { IROpcode } from '../constants';
import { IRInstruction } from './IRInstruction';

export function isIRAsmInstruction(
  instruction: IRInstruction,
): instruction is IRAsmInstruction {
  return instruction.opcode === IROpcode.ASM;
}

/**
 * ASM instruction
 */
export class IRAsmInstruction extends IRInstruction {
  constructor(readonly expression: string) {
    super(IROpcode.ASM);
  }

  override getDisplayName(): string {
    return `${chalk.bold.magentaBright('asm')} ${chalk.blueBright(
      `"${this.expression}"`,
    )}`;
  }
}
