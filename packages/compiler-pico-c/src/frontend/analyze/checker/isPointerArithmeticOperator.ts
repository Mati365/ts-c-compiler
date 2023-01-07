import { TokenType } from '@compiler/lexer/shared';

export function isPointerArithmeticOperator(operator: TokenType) {
  return operator === TokenType.PLUS || operator === TokenType.MINUS;
}
