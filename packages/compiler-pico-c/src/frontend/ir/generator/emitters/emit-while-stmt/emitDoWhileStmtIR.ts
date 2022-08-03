import {TokenType} from '@compiler/lexer/shared';
import {CPrimitiveType} from '@compiler/pico-c/frontend/analyze';

import {IRBrInstruction, IRICmpInstruction} from '../../../instructions';
import {IRConstant} from '../../../variables';
import {WhileStmtIRAttrs} from './emitWhileStmtIR';
import {
  createBlankStmtResult,
  IREmitterStmtResult,
} from '../types';

export function emitDoWhileStmtIR(
  {
    scope,
    context,
    node,
  }: WhileStmtIRAttrs,
): IREmitterStmtResult {
  const {emit, config, factory} = context;
  const {arch} = config;

  const result = createBlankStmtResult();
  const logicResult = emit.logicExpression(
    {
      scope,
      context,
      node: node.expression,
    },
  );

  const startLabel = factory.genTmpLabelInstruction();
  const contentResult = emit.block(
    {
      node: node.statement,
      scope,
      context,
    },
  );

  result.instructions.push(
    startLabel,
    ...result.instructions,
    ...contentResult.instructions,
    ...logicResult.instructions,
    new IRICmpInstruction(
      TokenType.DIFFERS,
      logicResult.output,
      IRConstant.ofConstant(CPrimitiveType.int(arch), 0),
    ),
    new IRBrInstruction(logicResult.output, startLabel),
  );

  return result;
}
