import { TokenType, Token, TokenKind } from '@ts-c-compiler/lexer';

/**
 * Returns true if token might be label
 */
export function isPossibleLabelToken(token: Token): boolean {
  return (
    (token.type === TokenType.KEYWORD && !token.kind) || // 2+2
    (token.type === TokenType.BRACKET &&
      token.kind === TokenKind.PARENTHES_BRACKET) // (2+2)
  );
}
