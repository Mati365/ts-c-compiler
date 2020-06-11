import * as R from 'ramda';

import {safeFirstMatch} from '@compiler/core/utils/safeFirstMatch';
import {isSign} from '@compiler/lexer/utils/matchCharacter';

const safeNumberMatch = (regex: RegExp, radix: number) => R.compose(
  R.unless(
    R.isNil,
    (val) => Number.parseInt(val, radix),
  ),
  safeFirstMatch(regex),
  R.replace(/_/g, ''),
);

/**
 * List with digit matchers
 */
export const DIGIT_FORMATS_PARSERS: Record<string, (str: string) => number> = {
  /**
   * Allowed HEX format:
   *  - 0c8h
   *  - $0c8
   *  - 0xc8
   *  - 0hc8
   */
  HEX: safeNumberMatch(/^(?=^(?:\$0?|0x|0h)(?:([\da-f_]+)h?$)|(?:(\d[\da-f_]+)h$))/i, 16),

  /**
   * Allowed DEC format:
   *  - 200
   *  - 0200
   *  - 0200d
   *  - 0d200
   */
  DEC: safeNumberMatch(/^(?:(?:(?:0d?)?([+-]?[\d_]+))|(?:0([\d_]+)d))$/, 10),

  /**
   * Allowed BIN format:
   *  - 11001000b
   *  - 11111111y
   *  - 0b000101
   *  - 0y010101
   *   -11_11111b
   */
  BIN: safeNumberMatch(/^(?:([\d_]+)[by]|0[by]([\d_]+))$/, 2),
};

/**
 * Parses assembler number
 *
 * @export
 * @param {string} text
 * @returns {[string, number]}
 */
export function parseNumberToken(text: string): [string, number] {
  let unsignedText = text;
  let sign = 1;
  const signPrefix = isSign(text[0]);

  if (signPrefix) {
    // ignore only sign
    if (text.length === 1)
      return null;

    sign = text[0] === '-' ? -1 : 1;
    unsignedText = text.slice(1);
  }

  for (const format in DIGIT_FORMATS_PARSERS) {
    const number = DIGIT_FORMATS_PARSERS[format](unsignedText);
    if (number !== null)
      return [format, sign * number];
  }

  return null;
}
