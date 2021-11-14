import {$enum} from 'ts-enum-util';
import {IdentifiersMap} from '@compiler/lexer/lexer';

export enum CStorageClassSpecifier {
  TYPEDEF = 'typedef',
  EXTERN = 'extern',
  STATIC = 'static',
  AUTO = 'auto',
  REGISTER = 'register',
}

export enum CCompilerKeyword {
  IF = 'if',
  ELSE = 'else',
  SWITCH = 'switch',
  RETURN = 'return',
  STRUCT = 'struct',
  TYPEDEF = 'typedef',
  ENUM = 'enum',
  WHILE = 'while',
  DO = 'do',
  FOR = 'for',
  ALIGN_AS = '_Alignas',
  ALIGN_OF = '_Alignof',
}

export enum CTypeQualifier {
  CONST = 'const',
  VOLATILE = 'volatile',
  RESTRICT = 'restrict',
  ATOMIC= ' _Atomic',
}

export enum CFunctionSpecifier {
  INLINE = 'inline',
  NORETURN = 'noreturn',
}

export enum CTypeSpecifier {
  FLOAT = 'float',
  DOUBLE = 'double',
  CHAR = 'char',
  INT = 'int',
  BOOL = 'bool',
  VOID = 'void',
  SHORT = 'short',
  LONG = 'long',
  SIGNED = 'signed',
  UNSIGNED = 'unsigned',
}

export enum CAssignOperator {
  ASSIGN = '=',
  MUL_ASSIGN = '*=',
  DIV_ASSIGN = '/=',
  MOD_ASSIGN = '%=',
  ADD_ASSIGN = '+=',
  SUB_ASSIGN = '-=',
  LEFT_ASSIGN = '<<=',
  RIGHT_ASSIGN = '>>=',
  AND_ASSIGN = '&=',
  XOR_ASSIGN = '^=',
  OR_ASSIGN = '||=',
}

export enum CUnaryCastOperator {
  AND = '&',
  MUL = '*',
  ADD = '+',
  SUB = '-',
  BITWISE_NOT = '~',
  LOGICAL_NOT = '!',
}

export type CCompilerTypeIdentifier = (
  CTypeQualifier
  | CStorageClassSpecifier
  | CTypeSpecifier
  | CFunctionSpecifier
);

export type CCompilerIdentifier = (
  CCompilerKeyword
  | CCompilerTypeIdentifier
);

export const CCOMPILER_FUNCTION_SPECIFIERS = $enum(CFunctionSpecifier).getValues();
export const CCOMPILER_TYPE_SPECIFIERS = $enum(CTypeSpecifier).getValues();
export const CCOMPILER_TYPE_QUALIFIERS = $enum(CTypeQualifier).getValues();
export const CCOMPILER_STORAGE_CLASS_SPECIFIERS = $enum(CStorageClassSpecifier).getValues();
export const CCOMPILER_UNARY_OPERATORS = $enum(CUnaryCastOperator).getValues();
export const CCOMPILER_ASSIGN_OPERATORS = $enum(CAssignOperator).getValues();

export const CCOMPILER_IDENTIFIERS_MAP: IdentifiersMap = {
  enum: CCompilerKeyword.ENUM,
  if: CCompilerKeyword.IF,
  switch: CCompilerKeyword.SWITCH,
  do: CCompilerKeyword.DO,
  while: CCompilerKeyword.WHILE,
  for: CCompilerKeyword.FOR,
  else: CCompilerKeyword.ELSE,
  return: CCompilerKeyword.RETURN,
  struct: CCompilerKeyword.STRUCT,
  int: CTypeSpecifier.INT,
  float: CTypeSpecifier.FLOAT,
  double: CTypeSpecifier.DOUBLE,
  bool: CTypeSpecifier.BOOL,
  void: CTypeSpecifier.VOID,
  char: CTypeSpecifier.CHAR,
  const: CTypeQualifier.CONST,
  volatile: CTypeQualifier.VOLATILE,
  restrict: CTypeQualifier.RESTRICT,
  short: CTypeSpecifier.SHORT,
  long: CTypeSpecifier.LONG,
  signed: CTypeSpecifier.SIGNED,
  unsigned: CTypeSpecifier.UNSIGNED,
  typedef: CStorageClassSpecifier.TYPEDEF,
  extern: CStorageClassSpecifier.EXTERN,
  static: CStorageClassSpecifier.STATIC,
  auto: CStorageClassSpecifier.AUTO,
  register: CStorageClassSpecifier.REGISTER,
  inline: CFunctionSpecifier.INLINE,
  _Atomic: CTypeQualifier.ATOMIC,
  _Noreturn: CFunctionSpecifier.NORETURN,
  _Alignas: CCompilerKeyword.ALIGN_AS,
  _Alignof: CCompilerKeyword.ALIGN_OF,
};
