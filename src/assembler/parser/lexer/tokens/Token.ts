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
  KEYWORD = 'KEYWORD',
  CHARACTER = 'CHARACTER',
  STRING = 'STRING',
  EOL = 'EOL',
  EOF = 'EOF',

  // Math
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MUL = 'MUL',
  DIV = 'DIV',
}

/**
 * Token type related meta kind
 *
 * @export
 * @enum {number}
 */
export enum TokenKind {
  // QUOTE
  SINGLE_QUOTE = 'SINGLE_QUOTE', // '
  DOUBLE_QUOTE = 'DOUBLE_QUOTE', // "

  // BRACKETS
  PARENTHES_BRACKET = 'PARENTHES_BRACKET', // ()
  CURLY_BRACKET = 'CURLY_BRACKET', // {}
  SQUARE_BRACKET = 'SQUARE_BRACKET', // []

  // ASM
  REGISTER = 'REGISTER',
}

/**
 * Result of tokenizing phrase
 *
 * @export
 * @class Token
 * @template ValueType
 * @template KindType
 */
export class Token<ValueType = any> {
  public type: TokenType;
  public kind: TokenKind;

  public text: string|number;
  public loc: TokenLocation;
  public value: ValueType;

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
    type: TokenType,
    kind: TokenKind,
    text: string,
    loc: TokenLocation,
    value: ValueType = null,
  ) {
    this.type = type;
    this.kind = kind;

    this.text = text;
    this.value = value;
    this.loc = loc;
  }
}
