import {Result} from '@compiler/core/monads/Result';
import {CompilerError} from '@compiler/core/shared/CompilerError';

import {
  compile,
  ast,
  safeResultAsmLexer,
  CompilerOutput,
} from './parser';

/**
 * Compile ASM file
 *
 * @export
 * @param {string} code
 * @returns {Result<CompilerOutput, CompilerError[]>}
 */
export function asm(code: string): Result<CompilerOutput, CompilerError[]> {
  return (
    safeResultAsmLexer(null, code)
      .andThen(ast)
      .andThen(compile)
  );
}
