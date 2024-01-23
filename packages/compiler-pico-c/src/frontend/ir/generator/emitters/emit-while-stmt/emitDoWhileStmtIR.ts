import { WhileStmtIRAttrs } from './emitWhileStmtIR';
import { createBlankStmtResult, IREmitterStmtResult } from '../types';

export function emitDoWhileStmtIR({
  scope,
  context,
  node,
}: WhileStmtIRAttrs): IREmitterStmtResult {
  const { emit, factory } = context;

  const result = createBlankStmtResult();
  const labels = {
    start: factory.labels.genTmpLabelInstruction(),
    end: factory.labels.genTmpLabelInstruction(),
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

  const logicResult = emit.logicExpression({
    scope,
    context,
    node: node.expression,
    jmpToLabelIf: {
      nonZero: labels.start,
    },
  });

  result.instructions.push(
    labels.start,
    ...result.instructions,
    ...contentResult.instructions,
    ...logicResult.instructions,
    labels.end,
  );

  return result;
}
