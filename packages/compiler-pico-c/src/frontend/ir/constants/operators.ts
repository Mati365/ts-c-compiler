import {TokenType} from '@compiler/lexer/shared';

export type CIRelOperator =
  | TokenType.GREATER_THAN
  | TokenType.GREATER_EQ_THAN
  | TokenType.LESS_THAN
  | TokenType.LESS_EQ_THAN
  | TokenType.DIFFERS
  | TokenType.EQUAL;
