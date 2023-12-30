import * as R from 'ramda';
import * as E from 'fp-ts/Either';

import { ccompiler, CCompilerConfig } from '../../../src';
export * from '../../../src/frontend/analyze';

export type MatcherResult = {
  pass: boolean;
  message(): string;
};

declare global {
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R = void> {
      toHaveCompilerError(errorCode?: number | string): MatcherResult;
    }
  }
}

/**
 * Compiles C file and check if status code is correct
 */
function toHaveCompilerError(
  received: string | [string, CCompilerConfig],
  code?: number,
): MatcherResult {
  const parseResult = R.is(Array, received)
    ? ccompiler(received[1] as CCompilerConfig)(received[0])
    : ccompiler()(received as string);

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
  toHaveCompilerError,
});
