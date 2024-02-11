import { Buffer } from 'buffer';
import { pipe } from 'fp-ts/function';
import { either as E } from 'fp-ts';
import { useState } from 'react';
import { useControlStrict } from '@under-control/forms';
import constate from 'constate';

import { asm } from '@ts-c-compiler/x86-assembler';
import {
  CCompilerArch,
  ccompiler,
  getX86BootsectorPreloaderBinary,
  wrapWithX86BootsectorAsm,
} from '@ts-c-compiler/compiler';

import type {
  EditorCompileResultValue,
  EditorEmulationValue,
  EditorStateValue,
} from './types';

const EXAMPLE_C_PROGRAM = /* c */ `#include <stdio.h>

int main() {
  printf("Hello world!");
  return 0;
}`;

const useEditorStateValue = () => {
  const [emulation, setEmulation] = useState<EditorEmulationValue>({
    state: 'stop',
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
    const result = (() => {
      switch (lang) {
        case 'nasm':
          return pipe(
            code,
            asm(),
            E.map(
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
            E.map(compilerResult => wrapWithX86BootsectorAsm(compilerResult.codegen.asm)),
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

      return { state: 'stop' };
    });
  };

  const stop = () => {
    setEmulation({
      state: 'stop',
    });
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
