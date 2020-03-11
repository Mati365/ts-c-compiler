import {Result, ok} from '@compiler/core/monads/Result';
import {CompilerError} from '@compiler/core/shared/CompilerError';

import {X86Compiler} from './X86Compiler';
import {ASTTree} from '../ast/ASTParser';
import {SecondPassResult} from './BinaryPassResults';

export type CompilerOutput = {
  compiler: X86Compiler,
  output: SecondPassResult,
};

export type CompilerFinalResult = Result<CompilerOutput, CompilerError[]>;

/**
 * Transform array of nodes into binary
 *
 * @export
 * @param {ASTTree} tree
 * @returns {CompilerFinalResult}
 */
export function compile(tree: ASTTree): CompilerFinalResult {
  const compiler = new X86Compiler(tree);

  return compiler.compile().andThen(
    (output) => ok({
      compiler,
      output,
    }),
  );
}
