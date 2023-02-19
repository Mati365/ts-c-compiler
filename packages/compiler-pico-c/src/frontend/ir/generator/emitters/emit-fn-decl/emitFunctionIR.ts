import { CFunctionDeclType } from '@compiler/pico-c/frontend/analyze';
import { ASTCFunctionDefinition } from '@compiler/pico-c/frontend/parser';
import { IRFnEndDeclInstruction } from '../../../instructions';

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
  const fnType = <CFunctionDeclType>node.type;
  const declaration = context.allocator.allocFunctionType(fnType);
  const result = createBlankStmtResult([declaration]);

  const endDeclarationLabel = context.factory.genTmpLabelInstruction();

  appendStmtResults(
    emitBlockItemIR({
      scope,
      node: node.content,
      context: {
        ...context,
        fnStmt: {
          declaration,
          labels: {
            endFnLabel: endDeclarationLabel,
          },
        },
      },
    }),
    result,
  );

  result.instructions.push(endDeclarationLabel, new IRFnEndDeclInstruction());
  return result;
}
