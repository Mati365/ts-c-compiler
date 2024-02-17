import { TokenType } from '@ts-cc/lexer';

export function isPointerArithmeticOperator(operator: TokenType) {
  return operator === TokenType.PLUS || operator === TokenType.MINUS;
}
