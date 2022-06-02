import {Option, none, some} from '@compiler/core/monads';
import {evalMathOp, isMathOpToken} from '@compiler/lexer/utils';

import {CMathOperator} from '@compiler/pico-c/constants';
import {CIRInstructionVarArg, isCIRConstant} from '../../variables';

type InstructionEvalArgs = {
  op: CMathOperator;
  a: CIRInstructionVarArg;
  b: CIRInstructionVarArg;
};

export function tryEvalBinaryInstruction(
  {
    op,
    a,
    b,
  }: InstructionEvalArgs,
): Option<number> {
  if (!isCIRConstant(a) || !isCIRConstant(b))
    return none();

  if (isMathOpToken(op)) {
    return some(
      evalMathOp(op, [b.constant, a.constant]),
    );
  }

  return none();
}
