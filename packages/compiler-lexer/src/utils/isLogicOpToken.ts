import {TokenType, Token} from '../tokens';

export function isLogicOpToken(token: Token): boolean {
  switch (token.type) {
    case TokenType.EQUAL:
    case TokenType.DIFFERS:
    case TokenType.GREATER_THAN:
    case TokenType.LESS_THAN:
    case TokenType.GREATER_EQ_THAN:
    case TokenType.LESS_EQ_THAN:
    case TokenType.AND:
    case TokenType.OR:
    case TokenType.NOT:
      return true;

    default:
      return false;
  }
}
