import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import { X86TargetCPU } from '@ts-cc/x86-assembler';

import { createCCompilerTimings } from './frontend/utils/createCCompilerTimings';
import { CCompilerConfig, CCompilerArch } from './constants/config';

import { CPreprocessorError, cIRCompiler } from './frontend';
import { genASMIRCode } from './backend';

import { CCompilerOutput } from './output/CCompilerOutput';

import type { CBackendError } from './backend/errors/CBackendError';
import type { CTypeCheckError } from './frontend/analyze';
import type { CGrammarError } from './frontend/parser/grammar/errors/CGrammarError';
import type { IRError } from './frontend/ir/errors/IRError';

export type CCompilerError =
  | CBackendError
  | CPreprocessorError
  | CTypeCheckError
  | CGrammarError
  | IRError;

/**
 * Main compiler entry, compiles code to binary
 *
 * @see
 *  Flow:
 *  Lexer -> ASTGenerator -> ASTIRCompiler -> X86CodeGen
 */
export const ccompiler =
  (
    ccompilerConfig: CCompilerConfig = {
      arch: CCompilerArch.X86_16,
      target: X86TargetCPU.I_386,
      optimization: {
        enabled: true,
      },
    },
  ) =>
  (code: string): E.Either<CCompilerError[], CCompilerOutput> => {
    const timings = createCCompilerTimings();

    return pipe(
      code,
      timings.chainIO(
        'ir',
        cIRCompiler({
          ...ccompilerConfig,
          timings,
        }),
      ),
      E.chainW(
        timings.chainIO('codegen', ({ ir, ...result }) =>
          pipe(
            genASMIRCode(ccompilerConfig, ir),
            E.map(codegen => ({
              ...result,
              codegen,
              ir,
            })),
          ),
        ),
      ),
      E.map(
        ({ tree, scope, ir, codegen }) =>
          new CCompilerOutput(code, tree, scope, ir, codegen, timings.unwrap()),
      ),
    );
  };
