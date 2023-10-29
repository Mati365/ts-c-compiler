import { TokenType } from '@ts-c-compiler/lexer';

export function isPointerArithmeticOperator(operator: TokenType) {
  return operator === TokenType.PLUS || operator === TokenType.MINUS;
}
