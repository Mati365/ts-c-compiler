import chalk from 'chalk';

import {CIROpcode} from '../constants';
import {CIRInstruction} from './CIRInstruction';

export function isIRCommentInstruction(instruction: CIRInstruction): instruction is CIRCommentInstruction {
  return instruction.opcode === CIROpcode.COMMENT;
}

/**
 * Comment instruction
 *
 * @export
 * @extends {CIRInstruction}
 */
export class CIRCommentInstruction extends CIRInstruction {
  constructor(readonly comment: string) {
    super(CIROpcode.COMMENT);
  }

  override getDisplayName(): string {
    return chalk.greenBright(`# ${this.comment}`);
  }
}
