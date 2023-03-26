import { CVariable } from '@compiler/pico-c/frontend/analyze';

import { IRAllocInstruction } from '../../../instructions';
import {
  IREmitterContextAttrs,
  IREmitterExpressionResult,
  appendStmtResults,
  createBlankExprResult,
} from '../types';

import { emitVariableLoadInitializerIR } from './emitVariableLoadInitializerIR';

type InitializerIREmitAttrs = IREmitterContextAttrs & {
  variable: CVariable;
};

/**
 * Emits array initializer and when array size is bigger
 * than specified in constant emits pointer to data segment
 *
 * @example
 *  array = &(label)
 *  label:
 *    db 1, 2, 3, 4
 */
export function emitVariableInitializerIR({
  scope,
  context,
  variable,
}: InitializerIREmitAttrs): IREmitterExpressionResult {
  const { allocator } = context;
  const result = createBlankExprResult();

  const { instructions } = result;
  const { initializer } = variable;

  if (variable.isInitialized()) {
    result.output = allocator.allocAsPointer(variable, allocatedVar => {
      instructions.push(IRAllocInstruction.ofDestPtrVariable(allocatedVar));

      appendStmtResults(
        emitVariableLoadInitializerIR({
          scope,
          context,
          initializerTree: initializer,
          destVar: allocatedVar,
        }),
        result,
      );
    });
  } else {
    // uninitialized variable
    result.output = allocator.allocAsPointer(variable);
    instructions.push(IRAllocInstruction.ofDestPtrVariable(result.output));
  }

  return result;
}
