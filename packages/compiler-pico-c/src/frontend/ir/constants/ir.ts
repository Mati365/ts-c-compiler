import {TokenType} from '@compiler/lexer/shared';
import {CPrimitiveType} from '../../analyze';

export type CIRMathOperator =
  | TokenType.PLUS
  | TokenType.MINUS
  | TokenType.MUL
  | TokenType.DIV
  | TokenType.POW
  | TokenType.MOD
  | TokenType.BIT_AND
  | TokenType.BIT_OR
  | TokenType.BIT_SHIFT_RIGHT
  | TokenType.BIT_SHIFT_LEFT
  | TokenType.BIT_NOT;

export type CIRelOperator =
  | TokenType.GREATER_THAN
  | TokenType.GREATER_EQ_THAN
  | TokenType.LESS_THAN
  | TokenType.LESS_EQ_THAN
  | TokenType.DIFFERS
  | TokenType.EQUAL;

export enum CIROpcode {
  ALLOC = 'ALLOC',
  INIT = 'INIT',
  CALL = 'CALL',
  LABEL = 'LABEL',
  IF = 'IF',
  REL = 'REL',
  PHI = 'PHI',
  DEF = 'DEF',
  RET = 'RET',
  MATH = 'MATH',
}

export type CIRType = CPrimitiveType | CPrimitiveType[];
