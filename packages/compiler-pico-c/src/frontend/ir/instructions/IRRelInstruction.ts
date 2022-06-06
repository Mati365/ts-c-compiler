import {CRelOperator} from '@compiler/pico-c/constants';

import {IROpcode} from '../constants';
import {IROpInstruction} from './IROpInstruction';
import {IRInstruction} from './IRInstruction';
import {IRInstructionVarArg, IRVariable} from '../variables';

export function isIRRelInstruction(instruction: IRInstruction): instruction is IRRelInstruction {
  return instruction.opcode === IROpcode.REL;
}

/**
 * Relationship instruction
 *
 * @export
 * @class IRRelInstruction
 * @extends {IROpInstruction<CRelOperator>}
 */
export class IRRelInstruction extends IROpInstruction<CRelOperator> {
  constructor(
    operator: CRelOperator,
    leftVar: IRInstructionVarArg,
    rightVar: IRInstructionVarArg,
    outputVar?: IRVariable,
  ) {
    super(IROpcode.REL, operator, leftVar, rightVar, outputVar);
  }
}
