import * as R from 'ramda';

import {safeFirstMatch} from '../../../utils/safeFirstMatch';
import {
  numberByteSize,
  roundToPowerOfTwo,
} from '../../../utils/numberByteSize';

import {TokenLocation} from './TokenLocation';
import {TokenType, Token} from './Token';

export enum NumberFormat {
  HEX,
  DEC,
  BIN,
}

export type NumberTokenValue = {
  number: number,
  byteSize: number,
  format: NumberFormat,
};

const safeNumberMatch = (regex: RegExp, radix: number) => R.compose(
  R.unless(
    R.isNil,
    (val) => Number.parseInt(val, radix),
  ),
  safeFirstMatch(regex),
  R.replace('_', ''),
);

/**
 * List with digit matchers
 */
export const DIGIT_FORMATS_PARSERS: {[key: string]: (str: string) => number} = {
  /**
   * Allowed HEX format:
   *  - 0c8h
   *  - $0c8
   *  - 0xc8
   *  - 0hc8
   */
  HEX: safeNumberMatch(/^(?:\$?0c|0x|0h)([\da-f]+)|(\d+h)|(0[\da-f]+h)$/i, 16),

  /**
   * Allowed DEC format:
   *  - 200
   *  - 0200
   *  - 0200d
   *  - 0d200
   */
  DEC: safeNumberMatch(/^(?:(?:(?:0d?)?([+-]?\d+))|(?:0(\d+)d))$/, 10),

  /**
   * Allowed BIN format:
   *  - 11001000b
   *  - 11111111y
   *  - 0b000101
   *  - 0y010101
   *   -11_11111b
   */
  BIN: safeNumberMatch(/^(?:(\d+)[by]|0[by](\d+))$/, 2),
};

/**
 * Parses assembler number
 *
 * @export
 * @param {string} text
 * @returns {[string, number]}
 */
export function parseNumberToken(text: string): [string, number] {
  for (const format in DIGIT_FORMATS_PARSERS) {
    const number = DIGIT_FORMATS_PARSERS[format](text);
    if (number !== null)
      return [format, number];
  }

  return null;
}

/**
 * Token which contains numeric value
 *
 * @export
 * @class NumberToken
 * @extends {Token<NumberTokenValue>}
 */
export class NumberToken extends Token<NumberTokenValue> {
  constructor(
    text: string,
    number: number,
    format: NumberFormat,
    loc: TokenLocation,
  ) {
    super(
      TokenType.NUMBER,
      null,
      text,
      loc,
      {
        // do not use signedNumberByteSize
        // do not resize number even if overflows
        byteSize: roundToPowerOfTwo(numberByteSize(Math.abs(number))),
        number,
        format,
      },
    );
  }

  static parse(token: string, loc: TokenLocation) {
    const numberInfo = parseNumberToken(token);
    if (numberInfo !== null)
      return new NumberToken(token, numberInfo[1], <any> numberInfo[0], loc.clone());

    return null;
  }
}
