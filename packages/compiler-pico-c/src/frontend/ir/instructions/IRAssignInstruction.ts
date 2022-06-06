import {IsOutputInstruction} from '../interfaces';
import {IROpcode} from '../constants';
import {IRInstruction} from './IRInstruction';
import {IRInstructionVarArg, IRVariable} from '../variables';

export function isIRAssignInstruction(instruction: IRInstruction): instruction is IRAssignInstruction {
  return instruction.opcode === IROpcode.ASSIGN;
}

/**
 * Instruction that assigns variable to tmp ir var
 *
 * @export
 * @class IRAssignInstruction
 * @extends {IRInstruction}
 * @implements {IsOutputInstruction}
 */
export class IRAssignInstruction extends IRInstruction implements IsOutputInstruction {
  constructor(
    readonly inputVar: IRInstructionVarArg,
    readonly outputVar: IRVariable,
  ) {
    super(IROpcode.ASSIGN);
  }

  override getDisplayName(): string {
    const {outputVar, inputVar} = this;

    return `${outputVar.getDisplayName(false)} = ${inputVar.getDisplayName()}`;
  }
}
