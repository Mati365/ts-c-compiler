import {CRelOperator} from '@compiler/pico-c/constants';

import {CIROpcode} from '../constants';
import {CIROpInstruction} from './CIROpInstruction';
import {CIRInstruction} from './CIRInstruction';
import {CIRInstructionVarArg, CIRVariable} from '../variables';

export function isIRRelInstruction(instruction: CIRInstruction): instruction is CIRRelInstruction {
  return instruction.opcode === CIROpcode.REL;
}

/**
 * Relationship instruction
 *
 * @export
 * @class CIRRelInstruction
 * @extends {CIROpInstruction<CRelOperator>}
 */
export class CIRRelInstruction extends CIROpInstruction<CRelOperator> {
  constructor(
    operator: CRelOperator,
    leftVar: CIRInstructionVarArg,
    rightVar: CIRInstructionVarArg,
    outputVar?: CIRVariable,
  ) {
    super(CIROpcode.REL, operator, leftVar, rightVar, outputVar);
  }
}
