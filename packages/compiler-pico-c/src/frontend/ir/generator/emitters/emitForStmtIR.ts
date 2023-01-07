import { ASTCForStatement } from '@compiler/pico-c/frontend/parser';
import { IRBrInstruction, IRJmpInstruction } from '../../instructions';

import {
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from './types';

import { emitDeclarationIR } from './emitDeclarationIR';

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

  const logicResult = emit.logicExpression({
    scope,
    context,
    node: node.condition,
  });

  const exprResult = emit.expression({
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
    ...declResult.instructions,
    labels.start,
    ...result.instructions,
    ...logicResult.instructions,
    ...(logicResult.output
      ? [new IRBrInstruction(logicResult.output, null, labels.end)]
      : []),
    ...contentResult.instructions,
    ...exprResult.instructions,
    new IRJmpInstruction(labels.start),
    ...(logicResult.output ? [labels.end] : []),
  );

  return result;
}
