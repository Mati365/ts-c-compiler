import {TokenType, Token} from '../tokens';

/**
 * Checks if end of file
 *
 * @export
 * @param {Token} token
 * @returns {boolean}
 */
export function isEOFToken(token: Token): boolean {
  return token.type === TokenType.EOF;
}
