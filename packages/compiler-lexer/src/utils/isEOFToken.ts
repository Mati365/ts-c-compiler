import { TokenType } from '../shared/TokenTypes';
import type { Token } from '../tokens';

/**
 * Checks if end of file
 */
export function isEOFToken(token: Token): boolean {
  return token.type === TokenType.EOF;
}
