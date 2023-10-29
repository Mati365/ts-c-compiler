import stripAnsi from 'strip-ansi';

import { stripNonPrintableCharacters, trimLines } from '@ts-c/core';

import { cIRCompiler } from 'frontend/cIRcompiler';
import { IRResultView } from 'frontend/ir';

export type MatcherResult = {
  pass: boolean;
  message(): string;
};

declare global {
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R = any> {
      toCompiledIRBeEqual(ir: string): MatcherResult;
    }
  }
}

function normalizeIRCode(str: string): string {
  return stripAnsi(trimLines(str));
}

function toCompiledIRBeEqual(
  source: string,
  expectedIR: string,
): MatcherResult {
  const result = cIRCompiler(source);
  if (result.isErr()) {
    return {
      pass: false,
      message: () =>
        `Compilation failed with ${
          result.unwrapErr()?.[0]?.code || '<unknown>'
        } error code!`,
    };
  }

  const formattedExpectedCode = normalizeIRCode(expectedIR);
  const formattedIRCode = normalizeIRCode(
    IRResultView.serializeToString(result.unwrap().ir),
  );

  return {
    pass:
      stripNonPrintableCharacters(formattedIRCode) ===
      stripNonPrintableCharacters(formattedExpectedCode),
    message: () =>
      [
        'Code:',
        trimLines(source),
        'Expected:',
        formattedExpectedCode,
        'but received:',
        formattedIRCode,
      ].join('\n\n'),
  };
}

expect.extend({
  toCompiledIRBeEqual,
});
