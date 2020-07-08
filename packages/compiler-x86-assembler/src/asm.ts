import {Result, ok} from '@compiler/core/monads/Result';
import {CompilerError} from '@compiler/core/shared/CompilerError';

import {formatDate, formatTime} from '@compiler/core/utils/format';
import {safeResultPreprocessor, PreprocessorResult} from './preprocessor';
import {PreprocessorInterpreterConfig} from './preprocessor/interpreter/PreprocessorInterpreter';
import {
  compile,
  ast,
  safeResultAsmLexer,
  CompilerOutput,
} from './parser';

export type AssemblerConfig = {
  preprocessor?: boolean,
};

/**
 * Compile ASM file
 *
 * @export
 * @param {string} code
 * @param {AssemblerConfig} [{preprocessor}={}]
 * @returns {Result<CompilerOutput, CompilerError[]>}
 */
export function asm(
  code: string,
  {
    preprocessor = true,
  }: AssemblerConfig = {},
): Result<CompilerOutput, CompilerError[]> {
  let preprocessorResult: Result<PreprocessorResult, CompilerError[]> = null;

  if (preprocessor) {
    const today = new Date;
    const preprocessorConfig: PreprocessorInterpreterConfig = {
      grammarConfig: {
        prefixChar: '%',
      },
      preExec: `
        %define __DATE__ '${formatDate(today, true)}'
        %define __TIME__ '${formatTime(today, true)}'
        %define __DATE_NUM__ ${formatDate(today, true, '')}
        %define __TIME_NUM__ ${formatTime(today, true, '')}
        %define __POSIX_TIME__ ${(+today / 1000) | 0}

        %idefine use16 [bits 16]
        %idefine use32 [bits 32]

        %idefine cpu(cpu_id) [target cpu_id]
        %idefine section(section_name) [section section_name]
      `,
    };

    preprocessorResult = safeResultPreprocessor(code, preprocessorConfig);
  } else {
    preprocessorResult = ok(
      new PreprocessorResult(null, code),
    );
  }

  return (
    preprocessorResult
      .andThen(({result}) => safeResultAsmLexer(null, result))
      .andThen(ast)
      .andThen(compile)
  );
}

/**
 * Compiles asm instruction without result,
 * it can crash if provided code is incorrect.
 *
 * Use it only in internal JITs etc.
 *
 * @export
 * @param {string} code
 * @param {AssemblerConfig} [config={}]
 * @returns {number[]}
 */
export function unsafeASM(code: string, config: AssemblerConfig = {}): number[] {
  return (
    asm(code, config)
      .unwrap()
      .output
      .getBinary()
  );
}
