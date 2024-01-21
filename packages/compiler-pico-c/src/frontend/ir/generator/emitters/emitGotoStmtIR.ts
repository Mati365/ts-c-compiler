import { ASTCGotoStatement } from 'frontend/parser';
import { IRJmpInstruction, IRLabelInstruction } from 'frontend/ir/instructions';

import {
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from './types';

type GotoStmtIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCGotoStatement;
};

export function emitGotoStmtIR({
  context,
  node,
}: GotoStmtIREmitAttrs): IREmitterStmtResult {
  const label = context.factory.goto.prefixLabel(node.name.text);

  return createBlankStmtResult([
    new IRJmpInstruction(new IRLabelInstruction(label)),
  ]);
}
