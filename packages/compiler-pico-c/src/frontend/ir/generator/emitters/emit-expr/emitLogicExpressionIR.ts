import { ASTCCompilerNode } from '@compiler/pico-c/frontend/parser';

import { IREmitterContextAttrs } from '../types';
import { BinaryExpressionCondInstructions } from './emitLogicBinaryJmpExpressionIR';

type LogicExpressionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCCompilerNode;
  instructions?: BinaryExpressionCondInstructions;
};

export function emitLogicExpressionIR({
  scope,
  context,
  node,
}: LogicExpressionIREmitAttrs) {
  return context.emit.expression({
    scope,
    context,
    node,
  });
}
