import { Buffer } from 'buffer';
import { pipe } from 'fp-ts/function';
import { either as E, array as A } from 'fp-ts';
import { useState } from 'react';
import { useControlStrict } from '@under-control/forms';
import constate from 'constate';

import { asm } from '@ts-cc/x86-assembler';
import {
  CCompilerArch,
  ccompiler,
  getX86BootsectorPreloaderBinary,
  wrapWithX86BootsectorAsm,
  type CCompilerError,
} from '@ts-cc/compiler';

import type { CompilerError } from '@ts-cc/core';
import {
  hasEditorEmulationResult,
  type EditorCompileResultError,
  type EditorCompileResultValue,
  type EditorEmulationValue,
  type EditorStateValue,
} from './types';

/* eslint-disable max-len */
const EXAMPLE_C_PROGRAM = /* c */ `/*
  +------------------------------------------------------------------------------------+
  | Run 'asm("xchg bx, bx")' and open dev tools to open CPU debugger breakpoint!'      |                                                |
  |                                                                                    |
  | Check more header files at:                                                        |
  | https://github.com/Mati365/ts-c-compiler/tree/main/packages/compiler-pico-c/src/fs |
  +------------------------------------------------------------------------------------+
        \\
         \\
            ╱|、
          (˚ˎ 。7
           |、˜〵
          じしˍ,)ノ
*/
#include <stdbool.h>
#include <kernel/graphics.h>

#define CHESS_BOARD_SIZE 8

#define CHESS_BOARD_WIDTH 160
#define CHESS_BOARD_HEIGHT 160
#define CHESS_BOARD_CELL_WIDTH (CHESS_BOARD_WIDTH / CHESS_BOARD_SIZE)

void chess_board_draw_board() {
  const int start_offset_x = GRAPH_SCREEN_WIDTH / 2 - CHESS_BOARD_WIDTH / 2;
  const int start_offset_y = GRAPH_SCREEN_HEIGHT / 2 - CHESS_BOARD_HEIGHT / 2;

  kernel_graph_draw_rect(
    start_offset_x - 1,
    start_offset_y - 1,
    CHESS_BOARD_WIDTH + 2,
    CHESS_BOARD_HEIGHT + 2,
    GRAPH_WHITE_COLOR
  );

  bool flag = true;

  for (int row = 0; row < CHESS_BOARD_SIZE; ++row) {
    flag = !flag;

    for (int col = 0; col < CHESS_BOARD_SIZE; ++col) {
      const char color = flag ? GRAPH_WHITE_COLOR : GRAPH_BLACK_COLOR;

      kernel_graph_fill_rect(
        col * CHESS_BOARD_CELL_WIDTH + start_offset_x,
        row * CHESS_BOARD_CELL_WIDTH + start_offset_y,
        CHESS_BOARD_CELL_WIDTH,
        CHESS_BOARD_CELL_WIDTH,
        color
      );

      flag = !flag;
    }
  }
}

int main() {
  kernel_graph_init();
  chess_board_draw_board();

  for (;;) {}
  return 0;
}`;
/* eslint-enable max-len */

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
