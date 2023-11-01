import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import { CompilerError } from '@ts-c-compiler/core';

import { AssemblerTimings } from '../../utils/createAssemblerTimings';
import { X86Compiler } from './X86Compiler';
import { ASTAsmTree } from '../ast/ASTAsmParser';
import { SecondPassResult } from './BinaryPassResults';

export type CompilerOutput = {
  compiler: X86Compiler;
  output: SecondPassResult;
  timings?: AssemblerTimings;
};

export type CompilerFinalResult = E.Either<CompilerError[], CompilerOutput>;

/**
 * Transform array of nodes into binary
 */
export function compile(tree: ASTAsmTree): CompilerFinalResult {
  const compiler = new X86Compiler(tree);

  return pipe(
    compiler.compile(),
    E.map(output => ({
      compiler,
      output,
    })),
  );
}
