import {Option, none, some} from '@compiler/core/monads';
import {evalMathOp, isMathOpToken} from '@compiler/lexer/utils';

import {CIRMathOperator} from '../../constants';
import {CIRInstructionVarArg, isCIRConstant} from '../../variables';

type InstructionEvalArgs = {
  op: CIRMathOperator;
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
