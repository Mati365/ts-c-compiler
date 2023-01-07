import { TokenType } from '../tokens';

/**
 * Checks if token can perform numeric expression
 */
export function isMathOpToken(type: TokenType): boolean {
  switch (type) {
    case TokenType.PLUS:
    case TokenType.MINUS:
    case TokenType.MUL:
    case TokenType.DIV:
    case TokenType.BIT_SHIFT_LEFT:
    case TokenType.BIT_SHIFT_RIGHT:
    case TokenType.BIT_OR:
    case TokenType.BIT_AND:
    case TokenType.POW:
      return true;

    default:
      return false;
  }
}

/**
 * Fast execute math operator
 */
export function evalMathOp(op: TokenType, args: number[]): number {
  switch (op) {
    case TokenType.PLUS:
      return args[0] + args[1];

    case TokenType.MINUS:
      return args[0] - args[1];

    case TokenType.MUL:
      return args[0] * args[1];

    case TokenType.DIV:
      return args[0] / args[1];

    case TokenType.BIT_SHIFT_LEFT:
      return args[0] << args[1];

    case TokenType.BIT_SHIFT_RIGHT:
      return args[0] >> args[1];

    case TokenType.BIT_OR:
      return args[0] | args[1];

    case TokenType.BIT_AND:
      return args[0] & args[1];

    case TokenType.POW:
      return args[0] ** args[1];

    default:
      return null;
  }
}
