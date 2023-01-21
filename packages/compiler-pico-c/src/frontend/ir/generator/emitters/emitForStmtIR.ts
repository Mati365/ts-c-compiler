import { ASTCForStatement } from '@compiler/pico-c/frontend/parser';
import { IRBrInstruction, IRJmpInstruction } from '../../instructions';

import {
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from './types';

import { emitDeclarationIR } from './emitDeclarationIR';
import { LogicBinaryExpressionLabels } from './emit-expr';

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
  const declResult = emitDeclarationIR({
    node: node.declaration,
    scope,
    context,
  });

  const startLabel = factory.genTmpLabelInstruction();
  const labels: LogicBinaryExpressionLabels = {
    ifTrueLabel: factory.genTmpLabelInstruction(),
    ifFalseLabel: factory.genTmpLabelInstruction(),
  };

  const logicResult = emit.logicExpression({
    scope,
    node: node.condition,
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
    context,
  });

  result.instructions.push(
    ...declResult.instructions,
    startLabel,
    ...result.instructions,
    ...logicResult.instructions,
    ...(logicResult.output
      ? [
          new IRBrInstruction(
            logicResult.output,
            labels.ifTrueLabel,
            labels.ifFalseLabel,
          ),
        ]
      : []),
    labels.ifTrueLabel,
    ...contentResult.instructions,
    ...exprResult.instructions,
    new IRJmpInstruction(startLabel),
    ...(logicResult.output ? [labels.ifFalseLabel] : []),
    labels.ifFalseLabel,
  );

  return result;
}
