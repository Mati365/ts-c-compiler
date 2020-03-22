import {TokenType, Token} from '../tokens';

export function isMathOpToken(token: Token): boolean {
  switch (token.type) {
    case TokenType.PLUS:
    case TokenType.MINUS:
    case TokenType.MUL:
    case TokenType.DIV:
    case TokenType.BIT_OR:
    case TokenType.BIT_AND:
      return true;

    default:
      return false;
  }
}
