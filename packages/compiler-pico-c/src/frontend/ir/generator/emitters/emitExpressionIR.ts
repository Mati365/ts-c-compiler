import {CVariable} from '@compiler/pico-c/frontend/analyze';
import {ASTCCompilerNode} from '@compiler/pico-c/frontend/parser';
import {IREmitterContextAttrs} from './types';

type ExpressionIREmitAttrs = IREmitterContextAttrs & {
  expression: ASTCCompilerNode;
};

type ExpressionIREmitResult = {
  outputVar: CVariable;
};

export function emitExpressionIR(attrs: ExpressionIREmitAttrs): ExpressionIREmitResult {
  console.info(attrs);
  return null;
}
