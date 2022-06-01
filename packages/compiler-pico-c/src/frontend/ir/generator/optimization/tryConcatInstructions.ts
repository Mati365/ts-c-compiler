import {fixme} from '@compiler/core/shared';
import {evalMathOp} from '@compiler/lexer/utils';

import {Option, none, some} from '@compiler/core/monads';
import {TokenType} from '@compiler/lexer/shared';
import {CIRInstruction, CIRMathInstruction, isIRMathInstruction} from '../../instructions';
import {CIRConstant} from '../../variables';

type InstructionConcatArgs = {
  a: CIRInstruction;
  b: CIRInstruction;
};

export function tryConcatInstructions(
  {
    a,
    b,
  }: InstructionConcatArgs,
): Option<CIRInstruction> {
  if (!isIRMathInstruction(a) || !isIRMathInstruction(b)) {
    return none();
  }

  const {operator} = a;
  const aArg = a.getFirstConstantArg();
  const bArg = b.getFirstConstantArg();

  if (!aArg
      || !bArg
      || a.operator !== b.operator
      || b.getFirstVarArg()?.name !== a.outputVar)
    return none();

  if (a.hasBothConstantArgs() || b.hasBothConstantArgs()) {
    console.warn(
      fixme('Compare args should not have both constant args! Propable const eval bug!'),
    );
  }

  switch (operator) {
    case TokenType.MUL:
    case TokenType.PLUS: {
      const evalResult = evalMathOp(operator, [aArg.constant, bArg.constant]);

      return some(
        new CIRMathInstruction(
          operator,
          a.getFirstVarArg(),
          CIRConstant.ofConstant(aArg.type, evalResult),
          a.outputVar,
        ),
      );
    }
  }

  return none();
}
