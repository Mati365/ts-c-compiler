import * as R from 'ramda';

import {CFunctionDeclType} from '@compiler/pico-c/frontend/analyze';
import {ASTCFunctionDefinition} from '@compiler/pico-c/frontend/parser';
import {
  IRFnEndDeclInstruction,
  IRRetInstruction,
  isIRRetInstruction,
} from '../../../instructions';

import {emitBlockItemIR} from './emitBlockItemIR';
import {
  appendStmtResults,
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from '../types';

type FunctionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCFunctionDefinition;
};

export function emitFunctionIR(
  {
    context,
    scope,
    node,
  }: FunctionIREmitAttrs,
): IREmitterStmtResult {
  const fnType = <CFunctionDeclType> node.type;
  const fnDecl = context.allocator.allocFunctionType(fnType);
  const result = createBlankStmtResult([fnDecl]);

  appendStmtResults(
    emitBlockItemIR(
      {
        scope,
        node: node.content,
        context: {
          ...context,
          parent: {
            fnDecl,
          },
        },
      },
    ),
    result,
  );

  if (!isIRRetInstruction(R.last(result.instructions)))
    result.instructions.push(new IRRetInstruction);

  result.instructions.push(new IRFnEndDeclInstruction);
  return result;
}
