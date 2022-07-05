import {isFuncDeclLikeType, isPointerLikeType} from '@compiler/pico-c/frontend/analyze';
import {ASTCCastExpression} from '@compiler/pico-c/frontend/parser';

import {
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterExpressionResult,
} from './types';

import {IRLoadInstruction} from '../../instructions';

export type UnaryLoadPtrValueIREmitAttrs = IREmitterContextAttrs & {
  castExpression: ASTCCastExpression;
};

export function emitUnaryLoadPtrValueIR(
  {
    castExpression,
    scope,
    context,
  }: UnaryLoadPtrValueIREmitAttrs,
): IREmitterExpressionResult {
  const {allocator, emit} = context;
  const result = createBlankStmtResult();

  const exprResult = emit.expression(
    {
      node: castExpression,
      context,
      scope,
    },
  );

  result.instructions.push(...exprResult.instructions);

  // load pointer pointing
  // todo: Add warn about dereferencing ptr!
  const {type: exprType} = exprResult.output;
  const baseType = (
    isPointerLikeType(exprType)
      ? exprType.baseType
      : exprType
  );

  // prevent load pointers to functions
  if (isFuncDeclLikeType(baseType)) {
    return {
      ...result,
      output: exprResult.output,
    };
  }

  const tmpVar = allocator.allocTmpVariable(baseType);
  result.instructions.push(
    new IRLoadInstruction(exprResult.output, tmpVar),
  );

  return {
    ...result,
    output: tmpVar,
  };
}
