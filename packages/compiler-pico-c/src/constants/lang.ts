import * as R from 'ramda';
import { $enum } from 'ts-enum-util';

import { IdentifiersMap } from '@ts-c-compiler/lexer';
import { TokenType } from '@ts-c-compiler/lexer';

export enum CStructAlign {
  PACKED = 'packed',
}

export enum CFunctionCallConvention {
  STDCALL = 'STDCALL',
}

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
  UNION = 'union',
  TYPEDEF = 'typedef',
  ENUM = 'enum',
  WHILE = 'while',
  DO = 'do',
  FOR = 'for',
  CASE = 'case',
  BREAK = 'break',
  CONTINUE = 'continue',
  DEFAULT = 'default',
  GOTO = 'goto',
  SIZEOF = 'sizeof',
  ASM = 'asm',
  ALIGN_AS = '_Alignas',
  ALIGN_OF = '_Alignof',
  STATIC_ASSERT = '_Static_assert',
}

export enum CStructLikeSpecifiers {
  STRUCT = CCompilerKeyword.STRUCT,
  UNION = CCompilerKeyword.UNION,
}

export enum CTypeQualifier {
  CONST = 'const',
  VOLATILE = 'volatile',
  RESTRICT = 'restrict',
  ATOMIC = ' _Atomic',
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
  BOOL = '_Bool',
  VOID = 'void',
  SHORT = 'short',
  LONG = 'long',
  LONG_LONG = 'long long',
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
  OR_ASSIGN = '|=',
}

export type CMathOperator =
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
  | TokenType.BIT_NOT
  | TokenType.NOT;

export type CLogicOperator = TokenType.AND | TokenType.OR;

export type CRelOperator =
  | TokenType.GREATER_THAN
  | TokenType.GREATER_EQ_THAN
  | TokenType.LESS_THAN
  | TokenType.LESS_EQ_THAN
  | TokenType.DIFFERS
  | TokenType.EQUAL;

export enum CUnaryCastOperator {
  AND = '&',
  MUL = '*',
  ADD = '+',
  SUB = '-',
  BITWISE_NOT = '~',
  LOGICAL_NOT = '!',
}

export type CCompilerTypeIdentifier =
  | CTypeQualifier
  | CStorageClassSpecifier
  | CTypeSpecifier
  | CFunctionSpecifier
  | CStructLikeSpecifiers;

export type CCompilerIdentifier = CCompilerKeyword | CCompilerTypeIdentifier;

export const CCOMPILER_ASSIGN_MATH_OPERATORS: Record<
  CAssignOperator,
  CMathOperator
> = {
  [CAssignOperator.ASSIGN]: null,
  [CAssignOperator.MUL_ASSIGN]: TokenType.MUL,
  [CAssignOperator.DIV_ASSIGN]: TokenType.DIV,
  [CAssignOperator.MOD_ASSIGN]: TokenType.MOD,
  [CAssignOperator.ADD_ASSIGN]: TokenType.PLUS,
  [CAssignOperator.SUB_ASSIGN]: TokenType.MINUS,
  [CAssignOperator.LEFT_ASSIGN]: TokenType.BIT_SHIFT_LEFT,
  [CAssignOperator.RIGHT_ASSIGN]: TokenType.BIT_SHIFT_RIGHT,
  [CAssignOperator.AND_ASSIGN]: TokenType.BIT_AND,
  [CAssignOperator.XOR_ASSIGN]: TokenType.POW,
  [CAssignOperator.OR_ASSIGN]: TokenType.BIT_OR,
};

export const CCOMPILER_INTEGRAL_SPECIFIERS: CTypeSpecifier[] = [
  CTypeSpecifier.CHAR,
  CTypeSpecifier.INT,
  CTypeSpecifier.SHORT,
  CTypeSpecifier.LONG,
  CTypeSpecifier.LONG_LONG,
  CTypeSpecifier.SIGNED,
  CTypeSpecifier.UNSIGNED,
];

export const CCOMPILER_FLOATING_SPECIFIERS: CTypeSpecifier[] = [
  CTypeSpecifier.FLOAT,
  CTypeSpecifier.DOUBLE,
];

export const CCOMPILER_STRUCT_LIKE_SPECIFIERS = $enum(
  CStructLikeSpecifiers,
).getValues();

export const CCOMPILER_FUNCTION_SPECIFIERS =
  $enum(CFunctionSpecifier).getValues();

export const CCOMPILER_TYPE_SPECIFIERS = $enum(CTypeSpecifier).getValues();
export const CCOMPILER_TYPE_QUALIFIERS = $enum(CTypeQualifier).getValues();
export const CCOMPILER_STORAGE_CLASS_SPECIFIERS = $enum(
  CStorageClassSpecifier,
).getValues();

export const CCOMPILER_UNARY_OPERATORS = $enum(CUnaryCastOperator).getValues();
export const CCOMPILER_ASSIGN_OPERATORS = $enum(CAssignOperator).getValues();

export const CCOMPILER_IDENTIFIERS_MAP: IdentifiersMap = [
  CCompilerKeyword,
  CTypeSpecifier,
  CTypeQualifier,
  CStorageClassSpecifier,
  CFunctionSpecifier,
  CCompilerKeyword,
].reduce((acc, enumerator) => {
  Object.assign(
    acc,
    R.fromPairs(
      $enum(enumerator)
        .getValues()
        .map(value => [value, value]),
    ),
  );

  return acc;
}, {});
