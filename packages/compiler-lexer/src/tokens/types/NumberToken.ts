import { numberByteSize, roundToPowerOfTwo } from '@ts-c/core';
import { parseNumberToken } from '../../utils';

import { TokenType, TokenLocation } from '../../shared';
import { Token } from '../Token';

export enum NumberFormat {
  HEX,
  DEC,
  BIN,
}

export type NumberTokenValue = {
  number: number;
  byteSize: number;
  format: NumberFormat;
};

/**
 * Token which contains numeric value
 */
export class NumberToken<O = any> extends Token<NumberTokenValue, O> {
  constructor(
    text: string,
    number: number,
    format: NumberFormat,
    loc: TokenLocation,
  ) {
    super(TokenType.NUMBER, null, text, loc, {
      // do not use signedNumberByteSize
      // do not resize number even if overflows
      byteSize: roundToPowerOfTwo(numberByteSize(Math.abs(number))),
      number,
      format,
    });
  }

  static parse(token: string, loc: TokenLocation) {
    const numberInfo = parseNumberToken(token);

    if (numberInfo !== null) {
      return new NumberToken(
        token,
        numberInfo[1],
        <any>numberInfo[0],
        loc.clone(),
      );
    }

    return null;
  }
}
