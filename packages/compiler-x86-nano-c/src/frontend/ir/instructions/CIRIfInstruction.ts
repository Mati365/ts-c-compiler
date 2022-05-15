import {CIROpcode} from '../constants';
import {CIRInstruction} from './CIRInstruction/CIRInstruction';
import {CIRLabelInstruction} from './CIRLabelInstruction';

export interface CIRBranchRelations<R> {
  ifTrue: R,
  ifFalse?: R,
}

export function isIRIfInstruction(instruction: CIRInstruction): instruction is CIRIfInstruction {
  return instruction.opcode === CIROpcode.IF;
}

/**
 * If else branch instruction, "else" is optional
 *
 * @export
 * @class CIRIfInstruction
 * @extends {CIRInstruction}
 * @implements {CIRBranchRelations<CIRLabelInstruction>}
 */
export class CIRIfInstruction extends CIRInstruction implements CIRBranchRelations<CIRLabelInstruction> {
  constructor(
    readonly expression: CIRInstruction,
    readonly ifTrue: CIRLabelInstruction,
    readonly ifFalse?: CIRLabelInstruction,
  ) {
    super(CIROpcode.IF);
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
