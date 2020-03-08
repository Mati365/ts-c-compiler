import {TokenType, Token, TokenKind} from '@compiler/lexer/tokens';

/**
 * Returns true if token might be label
 *
 * @param {Token} token
 * @returns {boolean}
 */
export function isPossibleLabelToken(token: Token): boolean {
  return (
    (token.type === TokenType.KEYWORD && !token.kind) // 2+2
      || (token.type === TokenType.BRACKET && token.kind === TokenKind.PARENTHES_BRACKET) // (2+2)
  );
}
