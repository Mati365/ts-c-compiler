import {TokenType} from '@compiler/lexer/shared';
import {CPrimitiveType} from '@compiler/pico-c/frontend/analyze';

import {IRIfInstruction, IRRelInstruction} from '../../../instructions';
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
    fnDecl,
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
      fnDecl,
      scope,
      context,
    },
  );

  result.instructions.push(
    startLabel,
    ...result.instructions,
    ...contentResult.instructions,
    ...logicResult.instructions,
    new IRIfInstruction(
      new IRRelInstruction(
        TokenType.DIFFERS,
        logicResult.output,
        IRConstant.ofConstant(CPrimitiveType.int(arch), 0),
      ),
      startLabel,
    ),
  );

  return result;
}
