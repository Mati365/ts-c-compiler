import * as R from 'ramda';

import {TokenLocation} from './TokenLocation';
import {
  toStringQuoteToken,
  toStringBracketToken,
  flipBracket,
  matchBracket,
} from '../utils/matchCharacter';

/**
 * It can be shared with preprocessor pseudolanguage
 *
 * @export
 * @enum {number}
 */
export enum TokenType {
  // Text
  QUOTE = 'QUOTE',
  ASSIGN = 'ASSIGN',
  BRACKET = 'BRACKET',
  COMMA = 'COMMA',
  SEMICOLON = 'SEMICOLON',
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
  POW = 'POW',
  BIT_AND = 'BIT_AND',
  BIT_OR = 'BIT_OR',
  BIT_SHIFT_RIGHT = 'BIT_SHIFT_RIGHT',
  BIT_SHIFT_LEFT = 'BIT_SHIFT_LEFT',

  INCREMENT = 'INCREMENT',
  DECREMENT = 'DECREMENT',
}

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
export class Token<V = any, O = any> {
  public readonly upperText: string;
  public readonly lowerText: string;

  /**
   * sometimes token should be replaced in parse phase
   * see assignLabelsToTokens, labels are replaced by numbers
   * but some instructions like relative jmps can be specified
   * by user using digit or label (label is localized relative to origin)
   */
  public originalToken: Token<O> = null;

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

  isReplaced(): boolean {
    return !!this.originalToken;
  }

  fork(newText: string = this.text): Token<V> {
    const {type, kind, loc, value} = this;

    return new Token(
      type,
      kind,
      newText,
      loc,
      value,
    );
  }

  toString() {
    const {text, type, kind} = this;

    switch (type) {
      case TokenType.QUOTE: {
        const quote = toStringQuoteToken(kind);

        return `${quote}${text}${quote}`;
      }

      case TokenType.BRACKET: {
        // lexer consumeBracketContent in lexer config
        if (text.length === 1 && matchBracket(text) !== null)
          return text;

        const bracket = toStringBracketToken(kind);
        return `${bracket}${text}${flipBracket(bracket)}`;
      }

      default:
    }

    return text;
  }
}
