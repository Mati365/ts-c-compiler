export enum IROpcode {
  ASSIGN = 'ASSIGN',
  ALLOC = 'ALLOC',
  STORE = 'STORE',
  LOAD = 'LOAD',
  CALL = 'CALL',
  LABEL = 'LABEL',
  IF = 'IF',
  REL = 'REL',
  PHI = 'PHI',
  DEF = 'DEF',
  RET = 'RET',
  MATH = 'MATH',
  LABEL_OFFSET = 'LABEL_OFFSET',
  LEA = 'LEA',
  DEF_CONST = 'DEF_CONST',
  COMMENT = 'COMMENT',
}
