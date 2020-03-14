import {Token, TokenType, TokenKind} from '../Token';
import {TokenLocation} from '../TokenLocation';

/**
 * Used in higher level grammar syntaxes
 *
 * @export
 * @class IdentifierToken
 * @extends {Token<T>}
 * @template T
 */
export class IdentifierToken<T = number> extends Token<T> {
  constructor(value: T, text: string, loc: TokenLocation) {
    super(
      TokenType.KEYWORD,
      TokenKind.IDENTIFIER,
      text,
      loc,
      value,
    );
  }
}
