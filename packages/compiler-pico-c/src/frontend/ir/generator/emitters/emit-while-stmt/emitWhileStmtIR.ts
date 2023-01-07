import { TokenType } from '@compiler/lexer/shared';
import { CPrimitiveType } from '@compiler/pico-c/frontend/analyze';
import { ASTCWhileStatement } from '@compiler/pico-c/frontend/parser';

import {
  IRBrInstruction,
  IRJmpInstruction,
  IRICmpInstruction,
} from '../../../instructions';

import { IRConstant } from '../../../variables';
import {
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from '../types';

export type WhileStmtIRAttrs = IREmitterContextAttrs & {
  node: ASTCWhileStatement;
};

export function emitWhileStmtIR({
  scope,
  context,
  node,
}: WhileStmtIRAttrs): IREmitterStmtResult {
  const { emit, config, factory } = context;
  const { arch } = config;

  const result = createBlankStmtResult();
  const logicResult = emit.logicExpression({
    scope,
    context,
    node: node.expression,
  });

  const labels = {
    start: factory.genTmpLabelInstruction(),
    end: factory.genTmpLabelInstruction(),
  };

  const contentResult = emit.block({
    node: node.statement,
    scope,
    context,
  });

  result.instructions.push(
    labels.start,
    ...result.instructions,
    ...logicResult.instructions,
    new IRICmpInstruction(
      TokenType.EQUAL,
      logicResult.output,
      IRConstant.ofConstant(CPrimitiveType.int(arch), 0),
    ),
    new IRBrInstruction(logicResult.output, labels.end),
    ...contentResult.instructions,
    new IRJmpInstruction(labels.start),
    labels.end,
  );

  return result;
}
