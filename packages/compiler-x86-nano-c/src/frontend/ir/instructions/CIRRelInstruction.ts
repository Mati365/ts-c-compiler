import {CIRelOperator, CIROpcode} from '../constants';

import {CIROpInstruction} from './CIROpInstruction';
import {
  CIRInstruction,
  CIRInstructionVarArg,
  CIRVarName,
} from './CIRInstruction';

export function isIRRelInstruction(instruction: CIRInstruction): instruction is CIRRelInstruction {
  return instruction.opcode === CIROpcode.REL;
}

/**
 * Relationship instruction
 *
 * @export
 * @class CIRRelInstruction
 * @extends {CIROpInstruction<CIRelOperator>}
 */
export class CIRRelInstruction extends CIROpInstruction<CIRelOperator> {
  constructor(
    operator: CIRelOperator,
    leftVar: CIRInstructionVarArg,
    rightVar: CIRInstructionVarArg,
    outputVar?: CIRVarName,
  ) {
    super(CIROpcode.REL, operator, leftVar, rightVar, outputVar);
  }
}
