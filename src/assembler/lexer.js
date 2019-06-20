import * as R from 'ramda';

import {
  INSTRUCTION_SET,
  REGISTER_SET,
} from './constants';

const safeFirstMatch = regex => R.compose(
  (output) => {
    if (!output || !output.length)
      return null;

    return R.defaultTo(output[2], output[1]);
  },
  R.match(regex),
);

const isQuote = R.test(/^["']$/);

const isNewline = R.test(/^\n$/);

/**
 * Enumerator which is stored inside type key
 */
export const TOKEN_TYPES = Object.freeze({
  COMMA: 'COMMA',

  REGISTER: 'REGISTER',
  MNEMONIC: 'MNEMONIC',
  ADDRESS: 'ADDRESS',
  LABEL: 'LABEL',

  NUMBER: 'NUMBER',
  OPERATOR: 'OPERATOR',

  CHARACTER: 'CHARACTER',
  STRING: 'STRING',
  DATA_DEFINE: 'DATA_DEFINE',
});

/**
 * If parse returns false or null - abort token parse
 * else assign to token flags
 */
export const TOKENS = Object.freeze({
  [TOKEN_TYPES.REGISTER]: R.prop(R.__, REGISTER_SET),

  [TOKEN_TYPES.MNEMONIC]: R.prop(R.__, INSTRUCTION_SET),

  [TOKEN_TYPES.NUMBER]: (() => {
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

      HEX: safeNumberMatch(/^(?:\$?0c|0x|0h)([\da-f]+)$/, 16),

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

    return (token) => {
      for (const format in digitFormats) {
        const value = digitFormats[format](token);
        if (value !== null) {
          return {
            type: format,
            value,
          };
        }
      }

      throw new Error('Unknown digit format!');
    };
  })(),
});

/**
 * Analyze single token
 *
 * @param {String} token
 */
const parseToken = (token) => {
  if (!token || !token.length)
    return null;

  for (const tokenType in TOKENS) {
    const result = TOKENS[tokenType](token);
    if (!result)
      continue;

    // result might return boolean return from has() function
    if (result === true) {
      return {
        type: tokenType,
        value: token,
      };
    }

    // it might be also object without type
    if (R.is(Object, result) && !result.type) {
      return {
        type: tokenType,
        value: result,
      };
    }

    return result;
  }

  throw new Error(`Unknown "${token}" token!`);
};

/**
 * Split code into tokens
 *
 * @see
 *  It contains also lexer logic!
 *
 * @param {String} code
 *
 * @returns {Token[]}
 */
function* lexer(code) {
  const {length} = code;

  let tokenBuffer = '';

  function* appendToken(token) {
    if (!token)
      return;

    tokenBuffer = '';
    yield token;
  }

  for (let i = 0; i < length; ++i) {
    const character = code[i];

    // special quote token, ignore all content, mark as ignored area
    if (isQuote(character)) {
      tokenBuffer = '';
      for (i++; i < length && !isQuote(code[i]); ++i)
        tokenBuffer += code[i];

      yield* appendToken(
        {
          type: TOKEN_TYPES.STRING,
          value: tokenBuffer,
        },
      );
      continue;
    }


    if (character === ',') {
      yield* appendToken(
        parseToken(tokenBuffer),
      );

      yield* appendToken(
        {
          type: TOKEN_TYPES.COMMA,
        },
      );
    } else if (character !== ' ' && !isNewline(character)) {
      // append character and find matching token
      tokenBuffer += character;
    } else {
      // if empty character
      yield* appendToken(
        parseToken(tokenBuffer),
      );
    }
  }
}

export default lexer;
