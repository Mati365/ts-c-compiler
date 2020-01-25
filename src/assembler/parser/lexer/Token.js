import * as R from 'ramda';
import safeFirstMatch from '../../utils/safeFirstMatch';

export const TOKEN_TYPES = Object.freeze(
  {
    COMMA: 'COMMA',
    NUMBER: 'NUMBER',
    OPERATOR: 'OPERATOR',
    KEYWORD: 'KEYWORD',
    CHARACTER: 'CHARACTER',
    STRING: 'STRING',
    EOL: 'EOL',
    EOF: 'EOF',
  },
);

export class TokenLocation {
  constructor(row = 0, column = 0) {
    this.row = row;
    this.column = column;
  }

  clone() {
    return new TokenLocation(this.row, this.column);
  }
}

export default class Token {
  constructor(type, text, loc, value = null) {
    this.type = type;
    this.kind = null;

    this.text = text;
    this.value = value;
    this.loc = loc;
  }
}

/**
 * Parse numbers
 *
 * @export
 * @class NumberToken
 * @extends {Token}
 */
export class NumberToken extends Token {
  constructor(text, number, format, loc) {
    super(
      TOKEN_TYPES.NUMBER,
      text,
      loc,
      {
        number,
        format,
      },
    );
  }

  static parse = (() => {
    const safeNumberMatch = (regex, radix) => R.compose(
      R.unless(
        R.isNil,
        val => Number.parseInt(val, radix),
      ),
      safeFirstMatch(regex),
      R.replace('_', ''),
    );

    /**
     * List with digit matchers
     */
    const digitFormats = {
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

    return (token, loc) => {
      for (const format in digitFormats) {
        const number = digitFormats[format](token);
        if (number !== null)
          return new NumberToken(token, number, format, loc);
      }

      return null;
    };
  })();
}

/**
 * Set of all parsers
 */
export const TOKEN_PARSERS = Object.freeze(
  {
    /** NUMBER */
    [TOKEN_TYPES.NUMBER]: NumberToken.parse,

    /** KEYWORD */
    [TOKEN_TYPES.KEYWORD]: R.T,
  },
);
