import {TokenType} from '../shared';

export function isNumericToken(type: TokenType): boolean {
  switch (type) {
    case TokenType.NUMBER:
    case TokenType.FLOAT_NUMBER:
      return true;

    default:
      return false;
  }
}
