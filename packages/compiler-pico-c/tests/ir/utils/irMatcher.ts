import stripAnsi from 'strip-ansi';
import * as E from 'fp-ts/Either';

import { stripNonPrintableCharacters, trimLines } from '@ts-c-compiler/core';

import { cIRCompiler } from '../../../src/frontend';
import { IRResultView } from '../../../src/frontend/ir';

export type MatcherResult = {
  pass: boolean;
  message(): string;
};

declare global {
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R = void, T = {}> {
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
  const result = cIRCompiler()(source);

  if (E.isLeft(result)) {
    return {
      pass: false,
      message: () =>
        `Compilation failed with ${
          result.left?.[0]?.code || '<unknown>'
        } error code!`,
    };
  }

  const formattedExpectedCode = normalizeIRCode(expectedIR);
  const formattedIRCode = normalizeIRCode(
    IRResultView.serializeToString(result.right.ir),
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
