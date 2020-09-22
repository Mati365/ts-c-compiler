import * as R from 'ramda';
import {IdentifiersMap} from '@compiler/lexer/lexer';

export enum CCompilerIdentifier {
  // Types
  FLOAT,
  INT,
  BOOL,
  VOID,
  STRUCT,

  // Blocks
  IF,
  ELSE,

  // Stmts
  RETURN,
}

export enum CPrimitiveModifiers {
  SHORT = 1 << 0,
  LONG = 1 << 1,
  SIGNED = 1 << 2,
  UNSIGNED = 1 << 3,
  CONSTANT = 1 << 4,
}

export class CType {
  constructor(
    public readonly keyword: string,
    public readonly byteSize: number,
    public readonly modifiers?: number,
  ) {}
}

export const PRIMITIVE_TYPES: Record<string, CType> = R.reduce(
  (acc, type) => {
    acc[type.keyword] = type;
    return acc;
  },
  {},
  [
    new CType('float', 4),
    new CType('int', 2),
    new CType('bool', 1),
    new CType('void', 1),
  ],
);

export const CCOMPILER_IDENTIFIERS_MAP: IdentifiersMap = {
  int: CCompilerIdentifier.INT,
  float: CCompilerIdentifier.FLOAT,
  bool: CCompilerIdentifier.BOOL,
  void: CCompilerIdentifier.VOID,
  if: CCompilerIdentifier.IF,
  else: CCompilerIdentifier.ELSE,
  return: CCompilerIdentifier.RETURN,
  struct: CCompilerIdentifier.STRUCT,
};
