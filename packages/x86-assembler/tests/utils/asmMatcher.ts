import * as R from 'ramda';

import { arrayToHexString } from '@ts-c/core';
import { asm, AssemblerConfig } from '../../src/asm';

export type BinaryOutputObject = {
  [key: number]: number[];
};

export type MatcherResult = {
  pass: boolean;
  message(): string;
};

declare global {
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R = void> {
      toOutputsBinary(match: BinaryOutputObject): MatcherResult;
      toHaveCompilerError(errorCode: number): MatcherResult;
    }
  }
}

/**
 * Tests if second pass compilation results matches binary
 */
function toOutputsBinary(
  received: string,
  binary: BinaryOutputObject,
): MatcherResult {
  const result = asm(received);
  if (result.isErr()) {
    return {
      pass: false,
      message: () => `Compilation failed! ${result.unwrapErr()}`,
    };
  }

  const { blobs } = result.unwrap().output;
  for (const [offset, code] of Object.entries(binary)) {
    const blob = blobs.get(+offset);
    if (!blob) {
      return {
        pass: false,
        message: () => `Missing blob offset ${offset}!`,
      };
    }

    const compiledBinary = blob.getBinary();
    if (!R.equals(compiledBinary, code)) {
      return {
        pass: false,
        message: () =>
          `Binary mismatch, expected ${arrayToHexString(
            code,
          )} but received ${arrayToHexString(compiledBinary)}!`,
      };
    }
  }

  return {
    pass: true,
    message: () => '',
  };
}

/**
 * Compiles asm file and check if status code is correct
 */
function toHaveCompilerError(
  received: string | [string, AssemblerConfig],
  code: number,
): MatcherResult {
  const parseResult = R.is(Array, received)
    ? asm(received[0], <AssemblerConfig>received[1])
    : asm(<string>received);

  if (parseResult.isOk()) {
    return {
      pass: false,
      message: () =>
        `expected err code to be equal ${this.utils.printExpected(
          code,
        )} but result is ok!`,
    };
  }

  const err = parseResult.unwrapErr();
  const pass = this.equals(
    err,
    expect.arrayContaining([
      expect.objectContaining({
        code,
      }),
    ]),
  );

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
  toOutputsBinary,
  toHaveCompilerError,
});
