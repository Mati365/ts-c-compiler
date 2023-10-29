import { safeFirstMatch } from '@ts-c/core';
import { TokenLocation, TokenType } from '../../shared';
import { Token } from '../Token';

/**
 * There is more floating point formats
 *
 * @see https://www.cs.uic.edu/~jbell/CourseNotes/C_Programming/DataTypesSummary.pdf
 */
const matchFloatNumber = safeFirstMatch(
  /^[+-]?(\d+([.]\d*)?(e[+-]?\d+)?)[FfLl]?$/i,
);

export type FloatNumberTokenValue = {
  number: number;
};

/**
 * @todo
 *  Add precision flags
 */
export class FloatNumberToken extends Token<FloatNumberTokenValue> {
  constructor(text: string, number: number, loc: TokenLocation) {
    super(TokenType.FLOAT_NUMBER, null, text, loc, {
      number,
    });
  }

  static parse(token: string, loc: TokenLocation) {
    const matchToken = matchFloatNumber(token);
    if (matchToken === null) {
      return null;
    }

    return new FloatNumberToken(token, Number.parseFloat(token), loc);
  }
}
