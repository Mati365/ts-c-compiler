import stripAnsi from 'strip-ansi';

import { stripNonPrintableCharacters, trimLines } from '@ts-c/core';
import { ccompiler } from 'ccompiler';

export type MatcherResult = {
  pass: boolean;
  message(): string;
};

declare global {
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R = any> {
      toCompiledAsmBeEqual(asm: string): MatcherResult;
    }
  }
}

function normalizeAsmCode(str: string): string {
  return stripAnsi(trimLines(str));
}

function toCompiledAsmBeEqual(
  source: string,
  expectedIR: string,
): MatcherResult {
  const result = ccompiler(source).map(({ codegen }) => codegen.asm);

  if (result.isErr()) {
    return {
      pass: false,
      message: () =>
        `Compilation failed with ${
          result.unwrapErr()?.[0]?.code || '<unknown>'
        } error code!`,
    };
  }

  const formattedExpectedCode = normalizeAsmCode(expectedIR);
  const formattedAsmCode = normalizeAsmCode(result.unwrap());

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
