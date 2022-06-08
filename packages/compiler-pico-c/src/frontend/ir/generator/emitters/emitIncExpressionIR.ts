import {TokenType} from '@compiler/lexer/shared';
import {CPrimitiveType, isPointerLikeType} from '@compiler/pico-c/frontend/analyze';

import {IRInstruction, IRLoadInstruction, IRMathInstruction, IRStoreInstruction} from '../../instructions';
import {IRConstant, IRVariable} from '../../variables';
import {IREmitterContextAttrs, IREmitterExpressionVarResult} from './types';
import {IRError, IRErrorCode} from '../../errors/IRError';

type IncExpressionIREmitAttrs = Pick<IREmitterContextAttrs, 'context'> & {
  sign: number;
  rootIRVar: IRVariable;
  pre?: boolean;
};

export function emitIncExpressionIR(
  {
    context,
    sign,
    rootIRVar,
    pre,
  }: IncExpressionIREmitAttrs,
): IREmitterExpressionVarResult {
  const {allocator, config} = context;
  const {type} = rootIRVar;

  if (!isPointerLikeType(type))
    throw new IRError(IRErrorCode.UNABLE_INC_NON_PTR_TYPE);

  const irSrcVar = allocator.allocTmpVariable(type.baseType);
  const irTmpVar = allocator.allocTmpVariable(irSrcVar.type);

  const incValue = isPointerLikeType(irSrcVar.type) ? irSrcVar.type.getByteSize() : 1;
  const instructions: IRInstruction[] = [
    new IRLoadInstruction(rootIRVar, irSrcVar),
    new IRMathInstruction(
      sign === 1
        ? TokenType.PLUS
        : TokenType.MINUS,
      irSrcVar,
      IRConstant.ofConstant(
        CPrimitiveType.int(config.arch),
        incValue,
      ),
      irTmpVar,
    ),
    new IRStoreInstruction(irTmpVar, rootIRVar),
  ];

  return {
    instructions,
    output: pre ? irTmpVar : irSrcVar,
  };
}
