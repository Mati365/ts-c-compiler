import {safeFirstMatch} from '@compiler/core/utils/safeFirstMatch';
import {
  TokenLocation,
  TokenType,
  Token,
} from '@compiler/lexer/tokens';

const matchFloatNumber = safeFirstMatch(/^[+-]?(\d+([.]\d*)?(e[+-]?\d+)?)$/i);

export type FloatNumberTokenValue = {
  number: number,
};

/**
 * @todo
 *  Add precision flags
 *
 * @export
 * @class FloatNumberToken
 * @extends {Token<FloatNumberTokenValue>}
 */
export class FloatNumberToken extends Token<FloatNumberTokenValue> {
  constructor(
    text: string,
    number: number,
    loc: TokenLocation,
  ) {
    super(
      TokenType.FLOAT_NUMBER,
      null,
      text,
      loc,
      {
        number,
      },
    );
  }

  static parse(token: string, loc: TokenLocation) {
    const matchToken = matchFloatNumber(token);
    if (matchToken === null)
      return null;

    return new FloatNumberToken(
      token,
      Number.parseFloat(token),
      loc,
    );
  }
}
