import {TokenType, Token} from '../tokens';

/**
 * Check for operators >, <, <=, >=, ==
 *
 * @export
 * @param {Token} token
 * @returns {boolean}
 */
export function isRelationOpToken(token: Token): boolean {
  switch (token.type) {
    case TokenType.LESS_EQ_THAN:
    case TokenType.LESS_THAN:
    case TokenType.GREATER_EQ_THAN:
    case TokenType.GREATER_THAN:
    case TokenType.EQUAL:
      return true;

    default:
      return false;
  }
}
