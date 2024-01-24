import { ASTCForStatement } from 'frontend/parser';
import { IRJmpInstruction } from '../../instructions';

import {
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from './types';

export type ForStmtIRAttrs = IREmitterContextAttrs & {
  node: ASTCForStatement;
};

export function emitForStmtIR({
  scope,
  context,
  node,
}: ForStmtIRAttrs): IREmitterStmtResult {
  const { emit, factory } = context;

  const result = createBlankStmtResult();
  const declResult = emit.block({
    node: node.declaration,
    scope,
    context,
  });

  const startLabel = factory.labels.genTmpLabelInstruction();
  const labels = {
    ifTrueLabel: factory.labels.genTmpLabelInstruction(),
    ifFalseLabel: factory.labels.genTmpLabelInstruction(),
    continueLabel: factory.labels.genTmpLabelInstruction(),
  };

  const logicResult = emit.logicExpression({
    scope,
    node: node.condition,
    jmpToLabelIf: {
      zero: labels.ifFalseLabel,
    },
    context: {
      ...context,
      conditionStmt: {
        labels,
      },
    },
  });

  const exprResult = emit.expression({
    scope,
    context,
    node: node.expression,
  });

  const contentResult = emit.block({
    node: node.statement,
    scope,
    context: {
      ...context,
      loopStmt: {
        startLabel: labels.ifTrueLabel,
        continueLabel: labels.continueLabel,
        finallyLabel: labels.ifFalseLabel,
      },
    },
  });

  result.instructions.push(
    ...declResult.instructions,
    startLabel,
    ...result.instructions,
    ...logicResult.instructions,
    labels.ifTrueLabel,
    ...contentResult.instructions,
    labels.continueLabel,
    ...exprResult.instructions,
    new IRJmpInstruction(startLabel),
    ...(logicResult.output ? [labels.ifFalseLabel] : []),
    labels.ifFalseLabel,
  );

  result.data.push(...exprResult.data);
  result.data.push(...contentResult.data);

  return result;
}
