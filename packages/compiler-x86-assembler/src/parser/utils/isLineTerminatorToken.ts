import {TokenType, Token} from '@compiler/lexer/tokens';

/**
 * Used for check when stop parsing
 *
 * @export
 * @param {Token} token
 * @returns {boolean}
 */
export function isLineTerminatorToken(token: Token): boolean {
  return token.type === TokenType.EOL || token.type === TokenType.EOF;
}
