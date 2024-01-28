import * as R from 'ramda';

import { CFunctionDeclType } from 'frontend/analyze';
import { ASTCFunctionDefinition } from 'frontend/parser';
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

/**
 * Emits function with definition like:
 *
 *  int sum(int x, int y) { return x + y; }
 */
export function emitFunctionIR({
  context,
  scope,
  node,
}: FunctionIREmitAttrs): IREmitterStmtResult {
  const { allocator, factory } = context;

  const fnType = <CFunctionDeclType>node.type;
  const declaration = allocator.allocFunctionType(fnType);
  const result = createBlankStmtResult([declaration]);

  if (fnType.hasDefinition()) {
    factory.goto.enterFunction();

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
  }

  result.instructions.push(new IRFnEndDeclInstruction());
  return result;
}
