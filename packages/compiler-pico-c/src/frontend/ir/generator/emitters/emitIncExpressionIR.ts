import {TokenType} from '@compiler/lexer/shared';
import {CPrimitiveType} from '@compiler/pico-c/frontend/analyze';

import {IRInstruction, IRLoadInstruction, IRMathInstruction, IRStoreInstruction} from '../../instructions';
import {IRConstant, IRVariable} from '../../variables';
import {IREmitterContextAttrs, IREmitterExpressionVarResult} from './types';

type IncExpressionIREmitAttrs = Pick<IREmitterContextAttrs, 'context'> & {
  sign: number;
  rootIRVar: IRVariable;
  pre?: boolean;
};

export function emitIncExpressionIR(
  {
    sign,
    context,
    rootIRVar,
    pre,
  }: IncExpressionIREmitAttrs,
): IREmitterExpressionVarResult {
  const {allocator, config} = context;

  const irSrcVar = allocator.allocTmpVariable(rootIRVar.type.getSourceType());
  const irTmpVar = allocator.allocTmpVariable(irSrcVar.type.getSourceType());

  const instructions: IRInstruction[] = [
    new IRLoadInstruction(rootIRVar, irSrcVar),
    new IRMathInstruction(
      sign === 1
        ? TokenType.PLUS
        : TokenType.MINUS,
      irSrcVar,
      IRConstant.ofConstant(
        CPrimitiveType.int(config.arch),
        1,
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
