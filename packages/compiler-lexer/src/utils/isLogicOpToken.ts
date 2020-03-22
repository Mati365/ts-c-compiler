import {TokenType} from '../tokens';

/**
 * Checks if token can perform logic expression
 *
 * @export
 * @param {TokenType} type
 * @returns {boolean}
 */
export function isLogicOpToken(type: TokenType): boolean {
  switch (type) {
    case TokenType.AND:
    case TokenType.OR:
    case TokenType.NOT:
      return true;

    default:
      return false;
  }
}

/**
 * Fast execute logic operator
 *
 * @export
 * @param {TokenType} op
 * @param {boolean[]} args
 * @returns {boolean}
 */
export function evalLogicOp(op: TokenType, args: boolean[]): boolean {
  switch (op) {
    case TokenType.AND:
      return args[0] && args[1];

    case TokenType.OR:
      return args[0] || args[1];

    case TokenType.NOT:
      return !args[0];

    default:
      return null;
  }
}
