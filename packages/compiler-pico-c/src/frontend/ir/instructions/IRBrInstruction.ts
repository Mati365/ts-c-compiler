import chalk from 'chalk';

import { IROpcode } from '../constants';
import { HasLabeledBranches } from '../interfaces';
import { IRInstructionVarArg } from '../variables';
import { IRInstruction } from './IRInstruction';
import { IRLabelInstruction } from './IRLabelInstruction';

export interface IRBranchRelations<R> {
  ifTrue: R;
  ifFalse?: R;
}

export function isIRBrInstruction(
  instruction: IRInstruction,
): instruction is IRBrInstruction {
  return instruction.opcode === IROpcode.BR;
}

/**
 * If else branch instruction, "else" is optional
 */
export class IRBrInstruction
  extends IRInstruction
  implements IRBranchRelations<IRLabelInstruction>, HasLabeledBranches
{
  constructor(
    readonly variable: IRInstructionVarArg,
    readonly ifTrue: IRLabelInstruction,
    readonly ifFalse?: IRLabelInstruction,
  ) {
    super(IROpcode.BR);
  }

  ofLabels([ifTrue, ifFalse]: IRLabelInstruction[]) {
    const { variable } = this;

    return new IRBrInstruction(variable, ifTrue, ifFalse) as this;
  }

  getLabels(): IRLabelInstruction[] {
    const { ifTrue, ifFalse } = this;

    return [ifTrue, ifFalse];
  }

  getDisplayName(): string {
    const { variable, ifTrue, ifFalse } = this;

    const argsStr = [
      variable.getDisplayName(),
      ifTrue && `true: ${chalk.white.bold(ifTrue.name)}`,
      ifFalse && `false: ${chalk.white.bold(ifFalse.name)}`,
    ]
      .filter(Boolean)
      .join(', ');

    return `${chalk.yellowBright('br')} ${argsStr}`;
  }
}
