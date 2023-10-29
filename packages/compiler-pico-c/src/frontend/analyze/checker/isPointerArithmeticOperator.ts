import { TokenType } from '@ts-c/lexer';

export function isPointerArithmeticOperator(operator: TokenType) {
  return operator === TokenType.PLUS || operator === TokenType.MINUS;
}
