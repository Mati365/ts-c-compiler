import chalk from 'chalk';

import { IROpcode } from '../constants';
import { IRInstruction } from './IRInstruction';

export function isIRCommentInstruction(
  instruction: IRInstruction,
): instruction is IRCommentInstruction {
  return instruction.opcode === IROpcode.COMMENT;
}

/**
 * Comment instruction
 */
export class IRCommentInstruction extends IRInstruction {
  constructor(readonly comment: string) {
    super(IROpcode.COMMENT);
  }

  override getDisplayName(): string {
    return chalk.greenBright(`# ${this.comment}`);
  }
}
