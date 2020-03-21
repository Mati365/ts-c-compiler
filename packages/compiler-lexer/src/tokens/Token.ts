import * as R from 'ramda';

import {TokenLocation} from './TokenLocation';

/**
 * It can be shared with preprocessor pseudolanguage
 *
 * @export
 * @enum {number}
 */
export enum TokenType {
  // Text
  QUOTE = 'QUOTE',
  BRACKET = 'BRACKET',
  COMMA = 'COMMA',
  COLON = 'COLON',
  NUMBER = 'NUMBER',
  FLOAT_NUMBER = 'FLOAT_NUMBER',
  KEYWORD = 'KEYWORD',
  CHARACTER = 'CHARACTER',
  STRING = 'STRING',
  EOL = 'EOL',
  EOF = 'EOF',

  // Logic
  EQUAL = 'EQUAL',
  DIFFERS = 'DIFFERS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_EQ_THAN = 'GREATER_EQ_THAN',
  LESS_EQ_THAN = 'LESS_EQ_THAN',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',

  // Math
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MUL = 'MUL',
  DIV = 'DIV',

  INCREMENT = 'INCREMENT',
  DECREMENT = 'DECREMENT',
}

export type LogicTokenType = (
  TokenType.AND
  | TokenType.OR
);

/**
 * Token type related meta kind
 *
 * @todo
 *  Remove compiler related types, for now it should be still OK
 *
 * @export
 * @enum {number}
 */
export enum TokenKind {
  // TEST(...)
  BRACKET_PREFIX = 'BRACKET_PREFIX',

  // QUOTE
  SINGLE_QUOTE = 'SINGLE_QUOTE', // '
  DOUBLE_QUOTE = 'DOUBLE_QUOTE', // "

  // BRACKETS
  PARENTHES_BRACKET = 'PARENTHES_BRACKET', // ()
  CURLY_BRACKET = 'CURLY_BRACKET', // {}
  SQUARE_BRACKET = 'SQUARE_BRACKET', // []

  // REGS
  REGISTER = 'REGISTER',

  // SIZE PREFIXES
  BYTE_SIZE_OVERRIDE = 'BYTE_SIZE_OVERRIDE',
  BRANCH_ADDRESSING_TYPE = 'BRANCH_ADDRESSING_TYPE',

  // OTHER
  // todo: register etc. move here
  IDENTIFIER = 'IDENTIFIER',
}

/**
 * Result of tokenizing phrase
 *
 * @export
 * @class Token
 * @template V value
 */
export class Token<V = any> {
  public readonly upperText: string;
  public readonly lowerText: string;

  /**
   * Creates an instance of Token.
   *
   * @param {TokenType} type
   * @param {string} text
   * @param {TokenLocation} loc
   * @param {ValueType} [value=null]
   * @memberof Token
   */
  constructor(
    public readonly type: TokenType,
    public readonly kind: TokenKind,
    public readonly text: string,
    public readonly loc: TokenLocation,
    public readonly value: V = null,
  ) {
    this.upperText = text && R.toUpper(text);
    this.lowerText = text && R.toLower(text);
  }

  toString() {
    const {text, type} = this;

    if (type === TokenType.QUOTE)
      return `"${text}"`;

    return text;
  }
}
