import * as R from 'ramda';

import {TokenType} from '@compiler/lexer/shared';
import {ASTCCastUnaryExpression} from '@compiler/pico-c/frontend/parser';

import {isPointerLikeType} from '@compiler/pico-c/frontend/analyze';
import {isIRMathInstruction, CIRLoadInstruction} from '../../instructions';
import {getPointerIndexMultiplier} from '../arithmetic/getPointerIndexMultiplier';

import {CIRError, CIRErrorCode} from '../../errors/CIRError';
import {IREmitterContextAttrs, IREmitterExpressionResult} from './types';
import {IRInstructionsOptimizationAttrs} from '../optimization';

export type PointerExpressionIREmitAttrs = IREmitterContextAttrs & {
  optimization?: IRInstructionsOptimizationAttrs;
  node: ASTCCastUnaryExpression;
  emitLoadPtr?: boolean;
};

export function emitPointerExpression(
  {
    context,
    scope,
    node,
    emitLoadPtr = true,
  }: PointerExpressionIREmitAttrs,
): IREmitterExpressionResult {
  const {type} = node;

  if (!isPointerLikeType(type))
    throw new CIRError(CIRErrorCode.EXPECTED_POINTER_EXPR_TYPE);

  const {allocator, emit} = context;
  const {instructions, output} = emit.expression(
    {
      optimization: {
        enabled: false,
      },
      type: node.type,
      node: node.castExpression,
      context,
      scope,
    },
  );

  const lastInstruction = R.last(instructions);
  if (isIRMathInstruction(lastInstruction)
      && [TokenType.PLUS, TokenType.MINUS].includes(lastInstruction.operator)
      && !lastInstruction.hasBothConstantArgs()) {
    const multipler = getPointerIndexMultiplier(type);

    instructions[instructions.length - 1] = lastInstruction.mapConstantArg(
      (constVar) => constVar.mapConstant(
        R.multiply(multipler),
      ),
    );
  }

  if (emitLoadPtr) {
    const resultPtrOutput = allocator.allocTmpVariable(type.baseType);
    instructions.push(
      new CIRLoadInstruction(
        output,
        resultPtrOutput.name,
      ),
    );

    return {
      output: resultPtrOutput,
      instructions,
    };
  }

  return {
    output,
    instructions,
  };
}
