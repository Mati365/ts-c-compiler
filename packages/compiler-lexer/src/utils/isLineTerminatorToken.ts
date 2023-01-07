import { TokenType, Token } from '../tokens';

/**
 * Used for check when stop parsing
 */
export function isLineTerminatorToken(token: Token): boolean {
  return token.type === TokenType.EOL || token.type === TokenType.EOF;
}
