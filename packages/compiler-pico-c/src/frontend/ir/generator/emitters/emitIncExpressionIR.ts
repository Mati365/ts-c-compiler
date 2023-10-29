import { TokenType } from '@ts-c-compiler/lexer';
import { ASTCCompilerNode } from 'frontend/parser';
import { CPrimitiveType, isPointerLikeType } from 'frontend/analyze';

import {
  IRInstruction,
  IRLoadInstruction,
  IRMathInstruction,
  IRStoreInstruction,
} from '../../instructions';

import { IRConstant, IRVariable } from '../../variables';
import { IREmitterContextAttrs, IREmitterExpressionVarResult } from './types';
import { IRError, IRErrorCode } from '../../errors/IRError';

type IncExpressionIREmitAttrs = Pick<IREmitterContextAttrs, 'context'> & {
  node: ASTCCompilerNode;
  sign: number;
  rootIRVar: IRVariable;
  pre?: boolean;
};

export function emitIncExpressionIR({
  context,
  sign,
  node,
  rootIRVar,
  pre,
}: IncExpressionIREmitAttrs): IREmitterExpressionVarResult {
  const { allocator, config } = context;
  const { type } = rootIRVar;

  if (!isPointerLikeType(type)) {
    throw new IRError(IRErrorCode.UNABLE_INC_NON_PTR_TYPE);
  }

  const irSrcVar = allocator.allocTmpVariable(node.type);
  const irTmpVar = allocator.allocTmpVariable(node.type);

  const incValue = isPointerLikeType(node.type) ? node.type.getByteSize() : 1;

  const instructions: IRInstruction[] = [
    new IRLoadInstruction(rootIRVar, irSrcVar),
    new IRMathInstruction(
      sign === 1 ? TokenType.PLUS : TokenType.MINUS,
      irSrcVar,
      IRConstant.ofConstant(CPrimitiveType.int(config.arch), incValue),
      irTmpVar,
    ),
    new IRStoreInstruction(irTmpVar, rootIRVar),
  ];

  return {
    instructions,
    output: pre ? irTmpVar : irSrcVar,
  };
}
