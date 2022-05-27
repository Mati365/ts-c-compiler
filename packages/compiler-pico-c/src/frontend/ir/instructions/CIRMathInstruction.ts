import {CIMathOperator, CIROpcode} from '../constants';
import {CIROpInstruction} from './CIROpInstruction';
import {CIRInstruction} from './CIRInstruction';
import {CIRInstructionVarArg} from '../variables';

export function isIRMathInstruction(instruction: CIRInstruction): instruction is CIRMathInstruction {
  return instruction.opcode === CIROpcode.MATH;
}

/**
 * Relationship instruction
 *
 * @export
 * @class CIRMathInstruction
 * @extends {CIROpInstruction<CIMathOperator>}
 */
export class CIRMathInstruction extends CIROpInstruction<CIMathOperator> {
  constructor(
    operator: CIMathOperator,
    leftVar: CIRInstructionVarArg,
    rightVar: CIRInstructionVarArg,
    outputVar?: string,
  ) {
    super(CIROpcode.MATH, operator, leftVar, rightVar, outputVar);
  }
}
