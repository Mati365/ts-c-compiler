import {IsOutputInstruction} from '../interfaces';
import {CIROpcode} from '../constants';
import {CIRInstruction} from './CIRInstruction';
import {CIRInstructionVarArg, CIRVariable} from '../variables';

export function isIRAssignInstruction(instruction: CIRInstruction): instruction is CIRAssignInstruction {
  return instruction.opcode === CIROpcode.ASSIGN;
}

/**
 * Instruction that assigns variable to tmp ir var
 *
 * @export
 * @class CIRAssignInstruction
 * @extends {CIRInstruction}
 * @implements {IsOutputInstruction}
 */
export class CIRAssignInstruction extends CIRInstruction implements IsOutputInstruction {
  constructor(
    readonly inputVar: CIRInstructionVarArg,
    readonly outputVar: CIRVariable,
  ) {
    super(CIROpcode.ASSIGN);
  }

  override getDisplayName(): string {
    const {outputVar, inputVar} = this;

    return `${outputVar.getDisplayName(false)} = ${inputVar.getDisplayName()}`;
  }
}
