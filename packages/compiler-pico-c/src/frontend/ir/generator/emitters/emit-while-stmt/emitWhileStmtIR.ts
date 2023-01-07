import { ASTCWhileStatement } from '@compiler/pico-c/frontend/parser';
import { IRBrInstruction, IRJmpInstruction } from '../../../instructions';

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
  const { emit, factory } = context;

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
    new IRBrInstruction(logicResult.output, null, labels.end),
    ...contentResult.instructions,
    new IRJmpInstruction(labels.start),
    labels.end,
  );

  return result;
}
