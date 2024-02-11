import { Buffer } from 'buffer';
import { pipe } from 'fp-ts/function';
import { either as E, array as A } from 'fp-ts';
import { useState } from 'react';
import { useControlStrict } from '@under-control/forms';
import constate from 'constate';

import { asm } from '@ts-c-compiler/x86-assembler';
import {
  CCompilerArch,
  ccompiler,
  getX86BootsectorPreloaderBinary,
  wrapWithX86BootsectorAsm,
  type CCompilerError,
} from '@ts-c-compiler/compiler';

import type { CompilerError } from '@ts-c-compiler/core';
import {
  hasEditorEmulationResult,
  type EditorCompileResultError,
  type EditorCompileResultValue,
  type EditorEmulationValue,
  type EditorStateValue,
} from './types';

const EXAMPLE_C_PROGRAM = /* c */ `/*
  +------------------------------------------------+
  | Run 'asm("xchg bx, bx")' and open dev tools to |
  | open CPU debugger breakpoint!'                 |
  +------------------------------------------------+
        \\
         \\
            ╱|、
          (˚ˎ 。7
           |、˜〵
          じしˍ,)ノ
*/
#include <stdio.h>
#include <kernel.h>

int main() {
  int rows = 8, coef = 1, space, i, j;

  kernel_screen_clear();

  for (i = 0; i < rows; i++) {
    for (space = 1; space <= rows - i; space++)
       printf("  ");

    for (j = 0; j <= i; j++) {
      if (j == 0 || i == 0) {
        coef = 1;
      } else {
         coef = coef * (i - j + 1) / j;
      }

      printf("%4d", coef);
    }

    printf("\\n");
  }

  for (;;) {}
  return 0;
}`;

const useEditorStateValue = () => {
  const [emulation, setEmulation] = useState<EditorEmulationValue>({
    state: 'stop',
    result: null,
  });

  const control = useControlStrict<EditorStateValue>({
    defaultValue: {
      lang: 'c',
      code: EXAMPLE_C_PROGRAM,
    },
  });

  const {
    value: { lang, code },
  } = control;

  const run = () => {
    const mapAssemblerErrors = A.map(
      (error: CompilerError<any>): EditorCompileResultError => ({
        loc: error.loc ?? null,
        message: error.message ?? 'Unknown assembler error!',
      }),
    );

    const mapCErrors = A.map(
      (error: CCompilerError): EditorCompileResultError => ({
        loc: error.loc ?? null,
        message: error.getCompilerMessage() ?? 'Unknown c compiler error!',
      }),
    );

    const result = (() => {
      switch (lang) {
        case 'nasm':
          return pipe(
            code,
            asm(),
            E.bimap(
              mapAssemblerErrors,
              ({ output }): EditorCompileResultValue => ({
                asmPassOutput: output,
                blob: Buffer.from(output.getBinary()),
              }),
            ),
          );

        case 'c':
          return pipe(
            code,
            ccompiler({
              arch: CCompilerArch.X86_16,
              optimization: {
                enabled: true,
              },
            }),
            E.bimap(mapCErrors, compilerResult =>
              wrapWithX86BootsectorAsm(compilerResult.codegen.asm),
            ),
            E.chainW(asmRaw =>
              pipe(
                asmRaw,
                asm({
                  preprocessor: true,
                  compilerConfig: {
                    maxPasses: 7,
                    externalLinkerAddrGenerator: () => 0xff_ff,
                  },
                }),
                E.mapLeft(mapAssemblerErrors),
              ),
            ),
            E.map(
              ({ output }): EditorCompileResultValue => ({
                asmPassOutput: output,
                blob: Buffer.from(
                  getX86BootsectorPreloaderBinary().concat(output.getBinary()),
                ),
              }),
            ),
          );

        default:
          throw new Error('Unknown compile lang!');
      }
    })();

    if (E.isLeft(result)) {
      console.error(result.left);
    }

    setEmulation({
      state: 'running',
      result,
    });
  };

  const pause = () => {
    setEmulation(oldState => {
      if (oldState.state === 'running') {
        return { state: 'pause', result: oldState.result };
      }

      return { state: 'stop', result: null };
    });
  };

  const stop = () => {
    setEmulation(oldState => ({
      state: 'stop',
      result: hasEditorEmulationResult(oldState) ? oldState.result : null,
    }));
  };

  return {
    control,
    emulation: {
      info: emulation,
      stop,
      pause,
      run,
    },
  };
};

export const [EditorStateProvider, useEditorState] = constate(useEditorStateValue);
