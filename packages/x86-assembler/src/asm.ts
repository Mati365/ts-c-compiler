import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import { CompilerError } from '@ts-c-compiler/core';
import { formatDate, formatTime } from '@ts-c-compiler/core';

import { createAssemblerTimings } from './utils/createAssemblerTimings';
import { safeResultPreprocessor, PreprocessorResult } from './preprocessor';
import { PreprocessorInterpreterConfig } from './preprocessor/interpreter/PreprocessorInterpreter';
import { compile, ast, safeResultAsmLexer } from './parser';

export type AssemblerConfig = {
  preprocessor?: boolean;
};

/**
 * Generates predefined functions thar are appended
 * to all assembler builds (if preprocessor enabled)
 */
export function genPreExecPreprocessorCode() {
  const today = new Date();

  return `
    %define __DATE__ '${formatDate(today, true)}'
    %define __TIME__ '${formatTime(today, true)}'
    %define __DATE_NUM__ ${formatDate(today, true, '')}
    %define __TIME_NUM__ ${formatTime(today, true, '')}
    %define __POSIX_TIME__ ${(+today / 1000) | 0}

    %idefine use16 [bits 16]
    %idefine use32 [bits 32]

    %idefine cpu(cpu_id) [target cpu_id]
    %idefine section(section_name) [section section_name]
  `;
}

/**
 * Compile ASM file
 */
export const asm =
  ({ preprocessor = true }: AssemblerConfig = {}) =>
  (code: string) => {
    const timings = createAssemblerTimings();

    let preprocessorResult: E.Either<
      CompilerError[],
      PreprocessorResult
    > | null = null;

    if (preprocessor) {
      const preprocessorConfig: PreprocessorInterpreterConfig = {
        preExec: genPreExecPreprocessorCode(),
        grammarConfig: {
          prefixChar: '%',
        },
      };

      preprocessorResult = pipe(
        code,
        timings.chainIO(
          'preprocessor',
          safeResultPreprocessor(preprocessorConfig),
        ),
      );
    } else {
      preprocessorResult = E.right(new PreprocessorResult(null, code));
    }

    return pipe(
      preprocessorResult,
      E.chainW(
        timings.chainIO('lexer', ({ result }) =>
          safeResultAsmLexer({})(result),
        ),
      ),
      E.chainW(timings.chainIO('ast', ast)),
      E.chainW(timings.chainIO('compiler', compile)),
      E.map(result => ({
        ...result,
        timings: timings.unwrap(),
      })),
    );
  };

/**
 * Compiles asm instruction without result,
 * it can crash if provided code is incorrect.
 *
 * Use it only in internal JITs etc.
 */
export const unsafeASM =
  (config: AssemblerConfig = {}) =>
  (code: string): number[] => {
    const maybeResult = pipe(
      code,
      asm(config),
      E.map(({ output }) => output.getBinary()),
    );

    if (E.isLeft(maybeResult)) {
      throw maybeResult.left;
    }

    return maybeResult.right;
  };
