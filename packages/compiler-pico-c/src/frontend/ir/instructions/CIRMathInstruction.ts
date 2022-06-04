import {CMathOperator} from '@compiler/pico-c/constants';
import {Option, none, some} from '@compiler/core/monads';
import {TokenType} from '@compiler/lexer/shared';

import {CIROpcode} from '../constants';
import {CIROpInstruction} from './CIROpInstruction';
import {CIRInstruction} from './CIRInstruction';
import {CIRInstructionVarArg, CIRVariable} from '../variables';

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
    outputVar?: CIRVariable,
  ) {
    super(CIROpcode.MATH, operator, leftVar, rightVar, outputVar);
  }

  tryFlipConstantsToRight(): Option<CIRMathInstruction> {
    if (this.hasBothConstantArgs())
      return none();

    const {operator, outputVar} = this;
    if (operator !== TokenType.PLUS && operator !== TokenType.MUL)
      return none();

    return some(
      new CIRMathInstruction(
        operator,
        this.getFirstVarArg(),
        this.getFirstConstantArg(),
        outputVar,
      ),
    );
  }
}
