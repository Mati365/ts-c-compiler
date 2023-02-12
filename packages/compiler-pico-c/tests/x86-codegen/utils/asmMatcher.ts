import stripAnsi from 'strip-ansi';

import { trimLines } from '@compiler/core/utils';
import { ccompiler } from '@compiler/pico-c/ccompiler';

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
    pass: formattedAsmCode === formattedExpectedCode,
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
