import { TokenType } from '../shared/TokenTypes';

/**
 * Check for operators >, <, <=, >=, ==
 */
export function isRelationOpToken(type: TokenType): boolean {
  switch (type) {
    case TokenType.LESS_EQ_THAN:
    case TokenType.LESS_THAN:
    case TokenType.GREATER_EQ_THAN:
    case TokenType.GREATER_THAN:
    case TokenType.EQUAL:
    case TokenType.DIFFERS:
      return true;

    default:
      return false;
  }
}

/**
 * Fast execute relation operator
 */
export function evalRelationOp(op: TokenType, args: number[]): boolean {
  switch (op) {
    case TokenType.LESS_EQ_THAN:
      return args[0] <= args[1];

    case TokenType.LESS_THAN:
      return args[0] < args[1];

    case TokenType.GREATER_EQ_THAN:
      return args[0] >= args[1];

    case TokenType.GREATER_THAN:
      return args[0] > args[1];

    case TokenType.EQUAL:
      return args[0] === args[1];

    case TokenType.DIFFERS:
      return args[0] !== args[1];

    default:
      return null;
  }
}
