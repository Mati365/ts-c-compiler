import { ASTCAsmStatement } from 'frontend/parser';

import {
  IRAsmInputOperands,
  IRAsmInstruction,
  IRAsmOutputOperands,
} from '../../instructions';

import {
  appendStmtResults,
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from './types';

import { emitIdentifierGetterIR } from './emitIdentifierGetterIR';
import { emitExpressionIR } from './emit-expr';

type AsmStatementIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCAsmStatement;
};

export function emitAsmStatementIR({
  node,
  scope,
  context,
}: AsmStatementIREmitAttrs): IREmitterStmtResult {
  const stmt = createBlankStmtResult();
  let counter = 0;

  const outputOperands = node.outputOperands?.reduce<IRAsmOutputOperands>((acc, item) => {
    const symbolicName = item.symbolicName ?? (counter++).toString();
    const getterResult = emitIdentifierGetterIR({
      emitValueAtAddress: false,
      node: item.expression,
      scope,
      context,
    });

    appendStmtResults(getterResult, stmt);

    acc[symbolicName] = {
      constraint: item.constraint,
      irVar: getterResult.output,
    };

    return acc;
  }, {});

  const inputOperands = node.inputOperands?.reduce<IRAsmInputOperands>((acc, item) => {
    const symbolicName = item.symbolicName ?? (counter++).toString();
    const getterResult = emitExpressionIR({
      node: item.expression,
      scope,
      context,
    });

    appendStmtResults(getterResult, stmt);

    acc[symbolicName] = {
      constraint: item.constraint,
      irVar: getterResult.output,
    };

    return acc;
  }, {});

  const clobberOperands = (node.clobberOperands ?? []).map(item => item.name);

  stmt.instructions.push(
    new IRAsmInstruction(node.asm, outputOperands, inputOperands, clobberOperands),
  );

  return stmt;
}
