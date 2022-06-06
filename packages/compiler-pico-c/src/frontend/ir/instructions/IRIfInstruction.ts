import {IROpcode} from '../constants';
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
 */
export class IRIfInstruction extends IRInstruction implements IRBranchRelations<IRLabelInstruction> {
  constructor(
    readonly expression: IRInstruction,
    readonly ifTrue: IRLabelInstruction,
    readonly ifFalse?: IRLabelInstruction,
  ) {
    super(IROpcode.IF);
  }

  getDisplayName(): string {
    const {
      expression,
      ifTrue,
      ifFalse,
    } = this;

    const str = `if: ${expression.getDisplayName()} then: ${ifTrue.name}`;
    return (
      ifFalse
        ? `${str} else ${ifFalse.name}`
        : str
    );
  }
}
