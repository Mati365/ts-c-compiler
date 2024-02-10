import stripAnsi from 'strip-ansi';
import * as E from 'fp-ts/Either';
import * as R from 'ramda';

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
      toHaveIRError(errorCode?: number | string): MatcherResult;
    }
  }
}

function normalizeIRCode(str: string): string {
  return stripAnsi(trimLines(str));
}

function toCompiledIRBeEqual(source: string, expectedIR: string): MatcherResult {
  const result = cIRCompiler()(source);

  if (E.isLeft(result)) {
    return {
      pass: false,
      message: () =>
        `Compilation failed with ${result.left?.[0]?.code || '<unknown>'} error code!`,
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

function toHaveIRError(received: string, code?: string): MatcherResult {
  const parseResult = cIRCompiler()(received as string);

  if (E.isRight(parseResult)) {
    return {
      pass: false,
      message: () =>
        `expected err code to be equal ${
          this.utils.printExpected(code) || '<any>'
        } but result is ok!`,
    };
  }

  const err = parseResult.left;
  const pass = (() => {
    if (R.isNil(code)) {
      return true;
    }

    return this.equals(
      err,
      expect.arrayContaining([
        expect.objectContaining({
          code,
        }),
      ]),
    );
  })();

  if (pass) {
    return {
      pass,
      message: () =>
        `expected err code ${this.utils.printReceived(
          err[0].code,
        )} to be equal ${this.utils.printExpected(code)}`,
    };
  }

  return {
    pass,
    message: () =>
      `expected err code ${this.utils.printReceived(
        err[0].code,
      )} to not be equal ${this.utils.printExpected(code)}`,
  };
}

expect.extend({
  toCompiledIRBeEqual,
  toHaveIRError,
});
