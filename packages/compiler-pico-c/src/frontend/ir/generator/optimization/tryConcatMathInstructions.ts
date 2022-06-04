import {fixme} from '@compiler/core/shared';

import {CIRError, CIRErrorCode} from '../../errors/CIRError';
import {Option, none, some} from '@compiler/core/monads';
import {TokenType} from '@compiler/lexer/shared';

import {CIRConstant, isCIRConstant, isCIRVariable} from '../../variables';
import {
  CIRInstruction,
  CIRMathInstruction,
  isIRMathInstruction,
} from '../../instructions';

const canConcatOperators = (a: TokenType, b: TokenType) => {
  if ([a, b].every((arg) => arg === TokenType.PLUS || TokenType.MINUS))
    return true;

  if ([a, b].every((arg) => arg === TokenType.MUL || TokenType.DIV))
    return true;

  return false;
};

const flipOperator = (op: TokenType) => {
  switch (op) {
    case TokenType.PLUS: return TokenType.MINUS;
    case TokenType.MINUS: return TokenType.PLUS;
    case TokenType.MUL: return TokenType.DIV;
    case TokenType.DIV: return TokenType.MUL;

    default:
      return null;
  }
};

const evalConcatedOperands = (aOp: TokenType, aValue: number, bOp: TokenType, bValue: number) => {
  switch (aOp) {
    case TokenType.MINUS:
      return bOp === TokenType.MINUS ? aValue + bValue : aValue - bValue;

    case TokenType.PLUS:
      return bOp === TokenType.MINUS ? aValue - bValue : aValue + bValue;

    case TokenType.DIV:
      return bOp === TokenType.DIV ? aValue * bValue : aValue / bValue;

    case TokenType.MUL:
      return bOp === TokenType.DIV ? aValue / bValue : aValue * bValue;

    default:
      throw new CIRError(CIRErrorCode.INCORRECT_UNARY_EXPR);
  }
};

type InstructionConcatArgs = {
  a: CIRInstruction;
  b: CIRInstruction;
};

export function tryConcatMathInstructions(
  {
    a,
    b,
  }: InstructionConcatArgs,
): Option<CIRInstruction> {
  if (!a || !b)
    return none();

  if (isIRMathInstruction(a) && isIRMathInstruction(b)) {
    const flippedA = a.tryFlipConstantsToRight().unwrapOr<CIRMathInstruction>(a);
    const flippedB = b.tryFlipConstantsToRight().unwrapOr<CIRMathInstruction>(b);

    const aArg = isCIRConstant(flippedA.rightVar) && flippedA.rightVar;
    const bArg = isCIRConstant(flippedB.rightVar) && flippedB.rightVar;

    if (!aArg
        || !bArg
        || !isCIRVariable(flippedB.leftVar)
        || flippedB.leftVar.name !== flippedA.outputVar?.name
        || !canConcatOperators(flippedA.operator, flippedB.operator)) {
      return none();
    }

    if (flippedA.hasBothConstantArgs() || flippedB.hasBothConstantArgs()) {
      console.warn(
        fixme('Compare args should not have both constant args! Propable const eval bug!'),
      );
    }

    const evalResult = evalConcatedOperands(
      flippedA.operator, aArg.constant,
      flippedB.operator, bArg.constant,
    );

    if ([TokenType.MINUS, TokenType.PLUS].includes(flippedA.operator)
        && Math.sign(evalResult) === -1) {
      return some(
        new CIRMathInstruction(
          flipOperator(flippedA.operator),
          flippedA.getFirstVarArg(),
          CIRConstant.ofConstant(aArg.type, -evalResult),
          flippedB.outputVar,
        ),
      );
    }

    return some(
      new CIRMathInstruction(
        flippedA.operator,
        flippedA.getFirstVarArg(),
        CIRConstant.ofConstant(aArg.type, evalResult),
        flippedB.outputVar,
      ),
    );
  }

  return none();
}
