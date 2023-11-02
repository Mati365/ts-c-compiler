import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

import { fixme } from '@ts-c-compiler/core';
import { TokenType } from '@ts-c-compiler/lexer';

import { isPrimitiveLikeType } from 'frontend/analyze';

import { IRError, IRErrorCode } from '../../../errors/IRError';
import { IRConstant, isIRConstant, isIRVariable } from '../../../variables';
import {
  IRInstruction,
  IRMathInstruction,
  isIRMathInstruction,
} from '../../../instructions';

const canConcatOperators = (a: TokenType, b: TokenType) => {
  if ([a, b].every(arg => arg === TokenType.PLUS || arg === TokenType.MINUS)) {
    return true;
  }

  if ([a, b].every(arg => arg === TokenType.MUL || arg === TokenType.DIV)) {
    return true;
  }

  return false;
};

const flipOperator = (op: TokenType) => {
  switch (op) {
    case TokenType.PLUS:
      return TokenType.MINUS;
    case TokenType.MINUS:
      return TokenType.PLUS;
    case TokenType.MUL:
      return TokenType.DIV;
    case TokenType.DIV:
      return TokenType.MUL;

    default:
      return null;
  }
};

const evalConcatedOperands = (
  aOp: TokenType,
  aValue: number,
  bOp: TokenType,
  bValue: number,
) => {
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
      throw new IRError(IRErrorCode.INCORRECT_UNARY_EXPR);
  }
};

type InstructionConcatArgs = {
  a: IRInstruction;
  b: IRInstruction;
};

export function tryConcatMathInstructions({
  a,
  b,
}: InstructionConcatArgs): O.Option<IRInstruction> {
  if (!a || !b) {
    return O.none;
  }

  if (isIRMathInstruction(a) && isIRMathInstruction(b)) {
    const flippedA = pipe(
      a.tryFlipConstantsToRight(),
      O.getOrElse(() => a),
    );

    const flippedB = pipe(
      b.tryFlipConstantsToRight(),
      O.getOrElse(() => b),
    );

    const aArg = isIRConstant(flippedA.rightVar) && flippedA.rightVar;
    const bArg = isIRConstant(flippedB.rightVar) && flippedB.rightVar;

    if (
      !aArg ||
      !bArg ||
      !isIRVariable(flippedB.leftVar) ||
      !flippedB.leftVar.isShallowEqual(flippedA.outputVar) ||
      !canConcatOperators(flippedA.operator, flippedB.operator)
    ) {
      return O.none;
    }

    if (flippedA.hasBothConstantArgs() || flippedB.hasBothConstantArgs()) {
      console.warn(
        fixme(
          'Compare args should not have both constant args! Propable const eval bug!',
        ),
      );
    }

    const evalResult = evalConcatedOperands(
      flippedA.operator,
      aArg.constant,
      flippedB.operator,
      bArg.constant,
    );

    if (
      [TokenType.MINUS, TokenType.PLUS].includes(flippedA.operator) &&
      Math.sign(evalResult) === -1
    ) {
      return O.some(
        new IRMathInstruction(
          flipOperator(flippedA.operator),
          flippedA.getFirstVarArg(),
          IRConstant.ofConstant(aArg.type, -evalResult),
          flippedB.outputVar,
        ),
      );
    }

    /**
     * Sometimes optimizer produces float point mul result.
     * Try to detect it and optimize to plain divide.
     *
     * @example
     *  Transforms:
     *
     *  %t{2}: int2B = %t{0}: int2B mul %0.5: char1B
     *
     *  To:
     *
     *  %t{2}: int2B = %t{0}: int2B div %2: char1B
     */
    if (
      flippedA.operator === TokenType.MUL &&
      !Number.isInteger(evalResult) &&
      isPrimitiveLikeType(aArg.type) &&
      !aArg.type.isFloating()
    ) {
      return O.some(
        new IRMathInstruction(
          TokenType.DIV,
          flippedA.getFirstVarArg(),
          IRConstant.ofConstant(aArg.type, 1 / evalResult),
          flippedB.outputVar,
        ),
      );
    }

    return O.some(
      new IRMathInstruction(
        flippedA.operator,
        flippedA.getFirstVarArg(),
        IRConstant.ofConstant(aArg.type, evalResult),
        flippedB.outputVar,
      ),
    );
  }

  return O.none;
}
