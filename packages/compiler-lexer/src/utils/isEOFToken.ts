import { TokenType, Token } from '../tokens';

/**
 * Checks if end of file
 */
export function isEOFToken(token: Token): boolean {
  return token.type === TokenType.EOF;
}
