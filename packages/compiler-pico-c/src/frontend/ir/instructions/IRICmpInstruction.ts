import { CRelOperator } from '@compiler/pico-c/constants';

import { IROpcode } from '../constants';
import { IROpInstruction } from './IROpInstruction';
import { IRInstruction } from './IRInstruction';
import { IRInstructionTypedArg, IRVariable } from '../variables';

export function isIRICmpInstruction(
  instruction: IRInstruction,
): instruction is IRICmpInstruction {
  return instruction.opcode === IROpcode.ICMP;
}

/**
 * Relationship instruction
 */
export class IRICmpInstruction extends IROpInstruction<CRelOperator> {
  constructor(
    operator: CRelOperator,
    leftVar: IRInstructionTypedArg,
    rightVar: IRInstructionTypedArg,
    outputVar?: IRVariable,
  ) {
    super(IROpcode.ICMP, operator, leftVar, rightVar, outputVar, 'icmp');
  }
}
