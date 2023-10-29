import { TokenType } from '../shared/TokenTypes';

export function isNumericToken(type: TokenType): boolean {
  switch (type) {
    case TokenType.NUMBER:
    case TokenType.FLOAT_NUMBER:
      return true;

    default:
      return false;
  }
}
