import {CIRelOperator, CIROpcode} from '../constants';
import {CIROpInstruction} from './CIROpInstruction';
import {CIRInstruction} from './CIRInstruction';
import {CIRInstructionVarArg} from '../variables';

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
    outputVar?: string,
  ) {
    super(CIROpcode.REL, operator, leftVar, rightVar, outputVar);
  }
}
