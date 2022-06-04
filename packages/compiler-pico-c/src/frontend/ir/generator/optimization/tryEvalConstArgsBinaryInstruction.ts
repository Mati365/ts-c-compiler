import {Option, none, some} from '@compiler/core/monads';
import {evalMathOp, isMathOpToken} from '@compiler/lexer/utils';

import {CIRMathInstruction} from '../../instructions';
import {isCIRConstant} from '../../variables';

export function tryEvalConstArgsBinaryInstruction(
  {
    operator,
    leftVar,
    rightVar,
  }: CIRMathInstruction,
): Option<number> {
  if (!isCIRConstant(leftVar) || !isCIRConstant(rightVar))
    return none();

  if (isMathOpToken(operator)) {
    return some(
      evalMathOp(operator, [leftVar.constant, rightVar.constant]),
    );
  }

  return none();
}
