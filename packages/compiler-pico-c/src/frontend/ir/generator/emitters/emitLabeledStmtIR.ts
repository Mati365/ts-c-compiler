import { ASTCGotoStatement } from 'frontend/parser';
import { IRLabelInstruction } from 'frontend/ir/instructions';

import {
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from './types';

type LabeledStmtIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCGotoStatement;
};

export function emitLabeledStmtIR({
  context,
  node,
}: LabeledStmtIREmitAttrs): IREmitterStmtResult {
  const label = context.factory.goto.prefixLabel(node.name.text);

  return createBlankStmtResult([new IRLabelInstruction(label)]);
}
