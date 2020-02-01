import * as R from 'ramda';

import {safeFirstMatch} from '../../../utils/safeFirstMatch';
import {numberByteSize} from '../../../utils/numberByteSize';

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
      text,
      loc,
      {
        byteSize: numberByteSize(number),
        number,
        format,
      },
    );
  }

  static parse = (() => {
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
    const digitFormats: {[key: string]: (str: string) => number} = {
      /**
       * Allowed HEX format:
       *  - 0c8h
       *  - $0c8
       *  - 0xc8
       *  - 0hc8
       */
      HEX: safeNumberMatch(/^(?:\$?0c|0x|0h)([\da-f]+)|([\da-f]+h)$/, 16),

      /**
       * Allowed DEC format:
       *  - 200
       *  - 0200
       *  - 0200d
       *  - 0d200
       */
      DEC: safeNumberMatch(/^(?:(?:(?:0d?)?(\d+))|(?:0(\d+)d))$/, 10),

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

    return (token: string, loc: TokenLocation) => {
      for (const format in digitFormats) {
        const number = digitFormats[format](token);
        if (number !== null)
          return new NumberToken(token, number, <any> format, loc);
      }

      return null;
    };
  })();
}
