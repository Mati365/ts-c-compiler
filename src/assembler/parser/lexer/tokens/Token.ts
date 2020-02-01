import {TokenLocation} from './TokenLocation';

export enum TokenType {
  QUOTE = 'QUOTE',
  COMMA = 'COMMA',
  NUMBER = 'NUMBER',
  OPERATOR = 'OPERATOR',
  KEYWORD = 'KEYWORD',
  CHARACTER = 'CHARACTER',
  STRING = 'STRING',
  EOL = 'EOL',
  EOF = 'EOF',
}

/**
 * Result of tokenizing phrase
 *
 * @export
 * @class Token
 * @template ValueType
 * @template KindType
 */
export class Token<ValueType = any, KindType = any> {
  public type: TokenType;
  public kind: KindType;

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
    text: string,
    loc: TokenLocation,
    value: ValueType = null,
  ) {
    this.type = type;
    this.kind = null;

    this.text = text;
    this.value = value;
    this.loc = loc;
  }
}
