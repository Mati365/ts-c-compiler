import { CMathOperator } from '#constants';
import { Option, none, some } from '@ts-c-compiler/core';
import { TokenType } from '@ts-c-compiler/lexer';

import { IROpcode } from '../constants';
import { IROpInstruction } from './IROpInstruction';
import { IRInstruction, IRInstructionArgs } from './IRInstruction';
import { IRInstructionTypedArg, IRVariable } from '../variables';

export function isIRMathInstruction(
  instruction: IRInstruction,
): instruction is IRMathInstruction {
  return !!instruction && instruction.opcode === IROpcode.MATH;
}

/**
 * Relationship instruction
 */
export class IRMathInstruction extends IROpInstruction<CMathOperator> {
  constructor(
    operator: CMathOperator,
    leftVar: IRInstructionTypedArg,
    rightVar: IRInstructionTypedArg,
    outputVar?: IRVariable,
  ) {
    super(IROpcode.MATH, operator, leftVar, rightVar, outputVar);
  }

  override ofArgs({
    input = [this.leftVar, this.rightVar],
    output = this.outputVar,
  }: IRInstructionArgs) {
    const { operator } = this;

    return new IRMathInstruction(
      operator,
      <IRVariable>input[0],
      <IRVariable>input[1],
      output,
    );
  }

  tryFlipConstantsToRight(): Option<IRMathInstruction> {
    if (!this.hasAnyConstantArg() || this.hasBothConstantArgs()) {
      return none();
    }

    const { operator, outputVar } = this;
    if (operator !== TokenType.PLUS && operator !== TokenType.MUL) {
      return none();
    }

    return some(
      new IRMathInstruction(
        operator,
        this.getFirstVarArg(),
        this.getFirstConstantArg(),
        outputVar,
      ),
    );
  }
}
