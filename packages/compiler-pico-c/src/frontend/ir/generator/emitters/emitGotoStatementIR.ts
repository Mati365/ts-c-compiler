import { ASTCGotoStatement } from 'frontend/parser';

import {
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from './types';

type GotoStatementIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCGotoStatement;
};

export function emitGotoStatementIR(
  _: GotoStatementIREmitAttrs,
): IREmitterStmtResult {
  const stmt = createBlankStmtResult();

  console.info('GOTO!!');

  return stmt;
}
