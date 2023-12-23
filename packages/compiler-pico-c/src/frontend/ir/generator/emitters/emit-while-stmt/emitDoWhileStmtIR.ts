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

  const labels = {
    start: factory.genTmpLabelInstruction(),
    end: factory.genTmpLabelInstruction(),
  };

  const contentResult = emit.block({
    node: node.statement,
    scope,
    context: {
      ...context,
      loopStmt: {
        startLabel: labels.start,
        finallyLabel: labels.end,
      },
    },
  });

  result.instructions.push(
    labels.start,
    ...result.instructions,
    ...contentResult.instructions,
    ...logicResult.instructions,
    new IRBrInstruction(logicResult.output, labels.start),
    labels.end,
  );

  return result;
}
