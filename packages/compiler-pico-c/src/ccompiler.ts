import { ok } from '@ts-c/core';

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
export function ccompiler(
  code: string,
  ccompilerConfig: CCompilerConfig = {
    arch: CCompilerArch.X86_16,
    optimization: {
      enabled: true,
    },
  },
) {
  const timings = createCCompilerTimings();

  return cIRCompiler(code, {
    ...ccompilerConfig,
    timings,
  })
    .andThen(
      timings.add('codegen', ({ ir, ...result }) =>
        genASMIRCode(ccompilerConfig, ir).andThen(codegen =>
          ok({
            ...result,
            codegen,
            ir,
          }),
        ),
      ),
    )
    .andThen(({ tree, scope, ir, codegen }) =>
      ok(new CCompilerOutput(code, tree, scope, ir, codegen, timings.unwrap())),
    );
}
