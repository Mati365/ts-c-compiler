import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import { createCCompilerTimings } from './frontend/utils/createCCompilerTimings';
import { CCompilerConfig, CCompilerArch } from './constants/config';

import { cIRCompiler } from './frontend';
import { genASMIRCode } from './backend';
import { CCompilerOutput } from './output/CCompilerOutput';

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
      optimization: {
        enabled: true,
      },
    },
  ) =>
  (code: string) => {
    const timings = createCCompilerTimings();

    return pipe(
      code,
      cIRCompiler({
        ...ccompilerConfig,
        timings,
      }),
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
