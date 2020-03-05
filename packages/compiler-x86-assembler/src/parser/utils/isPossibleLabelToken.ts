import {TokenType, Token} from '@compiler/lexer/tokens';

/**
 * Returns true if token might be label
 *
 * @param {Token} token
 * @returns {boolean}
 */
export function isPossibleLabelToken(token: Token): boolean {
  return token.type === TokenType.KEYWORD && !token.kind;
}
