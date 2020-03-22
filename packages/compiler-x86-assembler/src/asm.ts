import {Result} from '@compiler/core/monads/Result';
import {CompilerError} from '@compiler/core/shared/CompilerError';

import {safeResultPreprocessor} from '@compiler/preprocessor';
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
    safeResultPreprocessor(code)
      .andThen(({result}) => safeResultAsmLexer(null, result))
      .andThen(ast)
      .andThen(compile)
  );
}
