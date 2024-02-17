import * as O from 'fp-ts/Option';
import { evalMathOp, isMathOpToken } from '@ts-cc/lexer';

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
}: ConstInstructionEvalAttrs): O.Option<number> {
  if (!isIRConstant(leftVar) || !isIRConstant(rightVar)) {
    return O.none;
  }

  if (isMathOpToken(operator)) {
    return O.some(evalMathOp(operator, [leftVar.constant, rightVar.constant]));
  }

  return O.none;
}
