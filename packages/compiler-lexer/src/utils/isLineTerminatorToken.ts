import { TokenType } from '../shared/TokenTypes';
import type { Token } from '../tokens';

/**
 * Used for check when stop parsing
 */
export function isLineTerminatorToken(token: Token): boolean {
  return token.type === TokenType.EOL || token.type === TokenType.EOF;
}
