import chalk from 'chalk';
import {IROpcode} from '../constants';
import {HasLabeledBranches} from '../interfaces';
import {IRInstruction} from './IRInstruction';
import {IRLabelInstruction} from './IRLabelInstruction';

export interface IRBranchRelations<R> {
  ifTrue: R,
  ifFalse?: R,
}

export function isIRIfInstruction(instruction: IRInstruction): instruction is IRIfInstruction {
  return instruction.opcode === IROpcode.IF;
}

/**
 * If else branch instruction, "else" is optional
 *
 * @export
 * @class IRIfInstruction
 * @extends {IRInstruction}
 * @implements {IRBranchRelations<IRLabelInstruction>}
 * @implements {HasLabeledBranches}
 */
export class IRIfInstruction
  extends IRInstruction
  implements IRBranchRelations<IRLabelInstruction>, HasLabeledBranches {

  constructor(
    readonly expression: IRInstruction,
    readonly ifTrue: IRLabelInstruction,
    readonly ifFalse?: IRLabelInstruction,
  ) {
    super(IROpcode.IF);
  }

  ofLabels([ifTrue, ifFalse]: IRLabelInstruction[]) {
    return <this> new IRIfInstruction(
      this.expression,
      ifTrue,
      ifFalse,
    );
  }

  getLabels(): IRLabelInstruction[] {
    const {ifTrue, ifFalse} = this;

    return [ifTrue, ifFalse];
  }

  getDisplayName(): string {
    const {
      expression,
      ifTrue,
      ifFalse,
    } = this;

    const str = [
      chalk.yellowBright('if:'),
      expression.getDisplayName(),
      chalk.yellowBright('then'),
      chalk.white.bold(ifTrue.name),
    ].join(' ');

    return (
      ifFalse
        ? `${str} ${chalk.yellowBright('else')} ${chalk.white.bold(ifFalse.name)}`
        : str
    );
  }
}
