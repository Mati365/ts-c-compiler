import {TokenType} from '@compiler/lexer/shared';
import {CPrimitiveType} from '../../analyze';

export type CIRelOperator =
  | TokenType.GREATER_THAN
  | TokenType.GREATER_EQ_THAN
  | TokenType.LESS_THAN
  | TokenType.LESS_EQ_THAN
  | TokenType.DIFFERS
  | TokenType.EQUAL;

export enum CIROpcode {
  INIT = 'INIT',
  CALL = 'CALL',
  LABEL = 'LABEL',
  IF = 'IF',
  REL = 'REL',
  PHI = 'PHI',
  DEF = 'DEF',
  RET = 'RET',
}

export type CIRType = CPrimitiveType | CPrimitiveType[];
