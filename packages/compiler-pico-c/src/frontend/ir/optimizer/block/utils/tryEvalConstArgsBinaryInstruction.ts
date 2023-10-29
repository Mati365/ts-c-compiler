import { Option, none, some } from '@ts-c-compiler/core';
import { evalMathOp, isMathOpToken } from '@ts-c-compiler/lexer';

import { IRMathInstruction } from '../../../instructions';
import { isIRConstant } from '../../../variables';

type ConstInstructionEvalAttrs = Pick<
  IRMathInstruction,
  'operator' | 'leftVar' | 'rightVar'
>;

export function tryEvalConstArgsBinaryInstruction({
  operator,
  leftVar,
  rightVar,
}: ConstInstructionEvalAttrs): Option<number> {
  if (!isIRConstant(leftVar) || !isIRConstant(rightVar)) {
    return none();
  }

  if (isMathOpToken(operator)) {
    return some(evalMathOp(operator, [leftVar.constant, rightVar.constant]));
  }

  return none();
}
