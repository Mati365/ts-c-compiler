import { ASTCIfStatement } from 'frontend/parser';

import { IRJmpInstruction } from '../../instructions';
import { LogicBinaryExpressionLabels } from './emit-expr';

import {
  appendStmtResults,
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from './types';

export type IfStmtIRAttrs = IREmitterContextAttrs & {
  node: ASTCIfStatement;
};

export function emitIfStmtIR({
  scope,
  context,
  node,
}: IfStmtIRAttrs): IREmitterStmtResult {
  const { emit, factory } = context;

  const result = createBlankStmtResult();
  const { instructions } = result;

  const finallyLabel = factory.labels.genTmpLabelInstruction();
  const labels: LogicBinaryExpressionLabels = {
    ifTrueLabel: factory.labels.genTmpLabelInstruction(),
    ifFalseLabel: node.falseExpression
      ? factory.labels.genTmpLabelInstruction()
      : finallyLabel,
  };

  // compile if (a > 1 && b > 2) { ... }
  const logicResult = emit.logicExpression({
    scope,
    node: node.logicalExpression,
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

  appendStmtResults(logicResult, result);

  instructions.push(labels.ifTrueLabel);
  appendStmtResults(
    emit.block({
      node: node.trueExpression,
      scope,
      context,
    }),
    result,
  );

  if (labels.ifFalseLabel) {
    instructions.push(new IRJmpInstruction(finallyLabel), labels.ifFalseLabel);

    appendStmtResults(
      emit.block({
        node: node.falseExpression,
        scope,
        context,
      }),
      result,
    );
  }

  instructions.push(finallyLabel);
  return result;
}
