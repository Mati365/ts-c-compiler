import * as R from 'ramda';

import {CFunctionDeclType} from '@compiler/pico-c/frontend/analyze';
import {ASTCFunctionDefinition} from '@compiler/pico-c/frontend/parser';
import {IRRetInstruction, isIRRetInstruction} from '../../../instructions';

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
        context: {
          ...context,
          parent: {
            fnDecl,
          },
        },
        scope,
        node: node.content,
      },
    ),
    result,
  );

  if (!isIRRetInstruction(R.last(result.instructions)))
    result.instructions.push(new IRRetInstruction);

  return result;
}
