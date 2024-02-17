import stripAnsi from 'strip-ansi';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';

import { stripNonPrintableCharacters, trimLines } from '@ts-cc/core';
import { ccompiler } from '../../../src/ccompiler';

export type MatcherResult = {
  pass: boolean;
  message(): string;
};

declare global {
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R = void> {
      toCompiledAsmBeEqual(asm: string): MatcherResult;
    }
  }
}

function normalizeAsmCode(str: string): string {
  return stripAnsi(trimLines(str));
}

function toCompiledAsmBeEqual(source: string, expectedIR: string): MatcherResult {
  const result = pipe(
    source,
    ccompiler(),
    E.map(({ codegen }) => codegen.asm),
  );

  if (E.isLeft(result)) {
    return {
      pass: false,
      message: () =>
        `Compilation failed with ${result.left?.[0]?.code || '<unknown>'} error code!`,
    };
  }

  const formattedExpectedCode = normalizeAsmCode(expectedIR);
  const formattedAsmCode = normalizeAsmCode(result.right);

  return {
    pass:
      stripNonPrintableCharacters(formattedAsmCode) ===
      stripNonPrintableCharacters(formattedExpectedCode),

    message: () =>
      [
        'Code:',
        trimLines(source),
        'Expected:',
        formattedExpectedCode,
        'but received:',
        formattedAsmCode,
      ].join('\n\n'),
  };
}

expect.extend({
  toCompiledAsmBeEqual,
});
