import * as R from 'ramda';
import {IdentifiersMap} from '@compiler/lexer/lexer';

export enum CCompilerKeyword {
  IF = 'if',
  ELSE = 'else',
  RETURN = 'return',
  STRUCT = 'struct',
  TYPEDEF = 'typedef',
  ENUM = 'enum',
}

export enum CPrimitiveType {
  FLOAT = 'float',
  DOUBLE = 'double',
  CHAR = 'char',
  INT = 'int',
  BOOL = 'bool',
  VOID = 'void',
}

export enum CTypeQualifiers {
  CONST = 'const',
  VOLATILE = 'volatile',
}

export enum CTypeSpecifiers {
  SHORT = 'short',
  LONG = 'long',
  SIGNED = 'signed',
  UNSIGNED = 'unsigned',
}

export type CCompilerTypeIdentifier = (
  CPrimitiveType
  | CTypeQualifiers
  | CTypeSpecifiers
);

export type CCompilerIdentifier = (
  CCompilerKeyword
  | CCompilerTypeIdentifier
);

export class CType {
  constructor(
    public readonly keyword: string,
    public readonly byteSize: number,
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
    new CType('char', 1),
    new CType('bool', 1),
    new CType('void', 1),
  ],
);

export const CCOMPILER_IDENTIFIERS_MAP: IdentifiersMap = {
  enum: CCompilerKeyword.ENUM,
  if: CCompilerKeyword.IF,
  else: CCompilerKeyword.ELSE,
  return: CCompilerKeyword.RETURN,
  struct: CCompilerKeyword.STRUCT,
  int: CPrimitiveType.INT,
  float: CPrimitiveType.FLOAT,
  double: CPrimitiveType.DOUBLE,
  bool: CPrimitiveType.BOOL,
  void: CPrimitiveType.VOID,
  char: CPrimitiveType.CHAR,
  const: CTypeQualifiers.CONST,
  volatile: CTypeQualifiers.VOLATILE,
  short: CTypeSpecifiers.SHORT,
  long: CTypeSpecifiers.LONG,
  signed: CTypeSpecifiers.SIGNED,
  unsigned: CTypeSpecifiers.UNSIGNED,
};
