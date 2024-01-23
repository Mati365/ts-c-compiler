import { ASTCWhileStatement } from 'frontend/parser';
import { IRJmpInstruction } from '../../../instructions';

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
  const labels = {
    start: factory.labels.genTmpLabelInstruction(),
    end: factory.labels.genTmpLabelInstruction(),
  };

  const logicResult = emit.logicExpression({
    scope,
    context,
    node: node.expression,
    jmpToLabelIf: {
      zero: labels.end,
    },
  });

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
    ...logicResult.instructions,
    ...contentResult.instructions,
    new IRJmpInstruction(labels.start),
    labels.end,
  );

  return result;
}
