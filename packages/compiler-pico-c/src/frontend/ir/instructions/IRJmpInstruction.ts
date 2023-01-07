import chalk from 'chalk';

import { HasLabeledBranches, IsOutputInstruction } from '../interfaces';
import { IROpcode } from '../constants';
import { IRInstruction } from './IRInstruction';
import { IRLabelInstruction } from './IRLabelInstruction';

export function isIRJmpInstruction(
  instruction: IRInstruction,
): instruction is IRJmpInstruction {
  return instruction?.opcode === IROpcode.JMP;
}

/**
 * Instruction that performs branch
 */
export class IRJmpInstruction
  extends IRInstruction
  implements IsOutputInstruction, HasLabeledBranches
{
  constructor(readonly label: IRLabelInstruction) {
    super(IROpcode.JMP);
  }

  ofLabels([label]: IRLabelInstruction[]): this {
    return new IRJmpInstruction(label) as this;
  }

  getLabels(): IRLabelInstruction[] {
    return [this.label];
  }

  override getDisplayName(): string {
    return `${chalk.magentaBright('jmp')} ${chalk.bold.whiteBright(
      this.label.name,
    )}`;
  }
}
