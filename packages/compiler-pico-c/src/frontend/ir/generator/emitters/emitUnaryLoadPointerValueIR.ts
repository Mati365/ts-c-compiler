import {isFuncDeclLikeType, isPointerLikeType} from '@compiler/pico-c/frontend/analyze';
import {ASTCCastExpression} from '@compiler/pico-c/frontend/parser';

import {
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterExpressionResult,
} from './types';

import {IRLoadInstruction} from '../../instructions';
import {IRError, IRErrorCode} from '../../errors/IRError';

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
  if (isPointerLikeType(exprResult.output.type)) {
    const baseType = exprResult.output.type.baseType;

    // prevent load pointers to functions
    if (isFuncDeclLikeType(baseType)) {
      return {
        ...result,
        output: exprResult.output,
      };
    }

    const tmpVar = allocator.allocTmpVariable(exprResult.output.type.baseType);
    result.instructions.push(
      new IRLoadInstruction(exprResult.output, tmpVar),
    );

    return {
      ...result,
      output: tmpVar,
    };
  }

  throw new IRError(IRErrorCode.CANNOT_DEREFERENCE_NON_PTR_TYPE);
}
