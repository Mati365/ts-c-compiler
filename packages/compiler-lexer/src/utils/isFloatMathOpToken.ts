import { TokenType } from '../shared/TokenTypes';
import { isMathOpToken } from './isMathOpToken';

/**
 * Checks if token can perform numeric expression
 */
export function isFloatMathOpToken(type: TokenType): boolean {
  switch (type) {
    case TokenType.BIT_SHIFT_LEFT:
    case TokenType.BIT_SHIFT_RIGHT:
    case TokenType.BIT_OR:
    case TokenType.BIT_AND:
    case TokenType.POW:
    case TokenType.NOT:
      return false;

    default:
      return isMathOpToken(type);
  }
}
