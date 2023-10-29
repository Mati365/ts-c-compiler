import { ASTCCastExpression } from 'frontend/parser';
import { isFuncDeclLikeType, isPointerLikeType } from 'frontend/analyze';

import {
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterExpressionResult,
} from './types';

import { IRError, IRErrorCode } from '../../errors/IRError';
import { IRLoadInstruction } from '../../instructions';
import { isIRVariable } from '../../variables';

export type UnaryLoadPtrValueIREmitAttrs = IREmitterContextAttrs & {
  castExpression: ASTCCastExpression;
};

export function emitUnaryLoadPtrValueIR({
  castExpression,
  scope,
  context,
}: UnaryLoadPtrValueIREmitAttrs): IREmitterExpressionResult {
  const { allocator, emit } = context;
  const result = createBlankStmtResult();

  const exprResult = emit.expression({
    node: castExpression,
    context,
    scope,
  });

  result.instructions.push(...exprResult.instructions);

  // load pointer pointing
  // todo: Add warn about dereferencing ptr!
  const { type: exprType } = exprResult.output;
  const baseType = isPointerLikeType(exprType) ? exprType.baseType : exprType;

  // prevent load pointers to functions
  if (isFuncDeclLikeType(baseType)) {
    return {
      ...result,
      output: exprResult.output,
    };
  }

  const tmpVar = allocator.allocTmpVariable(baseType);
  if (!isIRVariable(exprResult.output)) {
    throw new IRError(IRErrorCode.INCORRECT_UNARY_EXPR);
  }

  result.instructions.push(new IRLoadInstruction(exprResult.output, tmpVar));

  return {
    ...result,
    output: tmpVar,
  };
}
