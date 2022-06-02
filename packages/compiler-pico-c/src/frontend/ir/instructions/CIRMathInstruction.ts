import {CMathOperator} from '@compiler/pico-c/constants';

import {CIROpcode} from '../constants';
import {CIROpInstruction} from './CIROpInstruction';
import {CIRInstruction} from './CIRInstruction';
import {CIRInstructionVarArg} from '../variables';

export function isIRMathInstruction(instruction: CIRInstruction): instruction is CIRMathInstruction {
  return !!instruction && instruction.opcode === CIROpcode.MATH;
}

/**
 * Relationship instruction
 *
 * @export
 * @class CIRMathInstruction
 * @extends {CIROpInstruction<CMathOperator>}
 */
export class CIRMathInstruction extends CIROpInstruction<CMathOperator> {
  constructor(
    operator: CMathOperator,
    leftVar: CIRInstructionVarArg,
    rightVar: CIRInstructionVarArg,
    outputVar?: string,
  ) {
    super(CIROpcode.MATH, operator, leftVar, rightVar, outputVar);
  }
}
