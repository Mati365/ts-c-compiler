import {SecondPassResult} from '@compiler/x86-assembler/parser/compiler/BinaryPassResults';

export type BinaryOutputObject = {

};

export type MatcherResult = {
  pass: boolean,
  message(): string,
};

declare global {
  namespace jest {
    interface Matchers<R = any> {
      toOutputsBinary(match: BinaryOutputObject): MatcherResult;
    }
  }
}


/**
 * Tests if second pass compilation results matches binary
 *
 * @param {SecondPassResult} result
 * @param {BinaryOutputObject} match
 * @returns {MatcherResult}
 */
function toOutputsBinary(result: SecondPassResult, match: BinaryOutputObject): MatcherResult {
  console.log(result.blobs, match); // eslint-disable-line

  return {
    pass: false,
    message: () => 'ABC',
  };
}


expect.extend(
  {
    toOutputsBinary,
  },
);
