import { IRBrInstruction } from '../../../instructions';
import { WhileStmtIRAttrs } from './emitWhileStmtIR';
import { createBlankStmtResult, IREmitterStmtResult } from '../types';

export function emitDoWhileStmtIR({
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

  const startLabel = factory.genTmpLabelInstruction();
  const contentResult = emit.block({
    node: node.statement,
    scope,
    context,
  });

  result.instructions.push(
    startLabel,
    ...result.instructions,
    ...contentResult.instructions,
    ...logicResult.instructions,
    new IRBrInstruction(logicResult.output, startLabel),
  );

  return result;
}
