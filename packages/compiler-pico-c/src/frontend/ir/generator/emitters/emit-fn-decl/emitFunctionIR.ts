import * as R from 'ramda';

import { CFunctionDeclType } from '@compiler/pico-c/frontend/analyze';
import { ASTCFunctionDefinition } from '@compiler/pico-c/frontend/parser';
import {
  IRFnEndDeclInstruction,
  IRRetInstruction,
  isIRRetInstruction,
} from '../../../instructions';

import { emitBlockItemIR } from './emitBlockItemIR';
import {
  appendStmtResults,
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from '../types';

type FunctionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCFunctionDefinition;
};

export function emitFunctionIR({
  context,
  scope,
  node,
}: FunctionIREmitAttrs): IREmitterStmtResult {
  const { allocator } = context;

  const fnType = <CFunctionDeclType>node.type;
  const declaration = allocator.allocFunctionType(fnType);
  const result = createBlankStmtResult([declaration]);

  const blockStmt = emitBlockItemIR({
    scope,
    node: node.content,
    context: {
      ...context,
      fnStmt: {
        declaration,
      },
    },
  });

  appendStmtResults(blockStmt, result);

  if (!isIRRetInstruction(R.last(result.instructions))) {
    result.instructions.push(new IRRetInstruction());
  }

  result.instructions.push(new IRFnEndDeclInstruction());
  return result;
}
