import {Option, none, some} from '@compiler/core/monads';
import {evalMathOp, isMathOpToken} from '@compiler/lexer/utils';

import {IRMathInstruction} from '../../instructions';
import {isIRConstant} from '../../variables';

export function tryEvalConstArgsBinaryInstruction(
  {
    operator,
    leftVar,
    rightVar,
  }: IRMathInstruction,
): Option<number> {
  if (!isIRConstant(leftVar) || !isIRConstant(rightVar))
    return none();

  if (isMathOpToken(operator)) {
    return some(
      evalMathOp(operator, [leftVar.constant, rightVar.constant]),
    );
  }

  return none();
}
