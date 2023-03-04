import { ASTCAsmStatement } from '@compiler/pico-c/frontend/parser';
import { IRAsmInstruction } from '../../instructions';
import {
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from './types';

type AsmStatementIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCAsmStatement;
};

export function emitAsmStatementIR({
  node,
}: AsmStatementIREmitAttrs): IREmitterStmtResult {
  return createBlankStmtResult([new IRAsmInstruction(node.expression)]);
}
