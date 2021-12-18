import * as R from 'ramda';
import {$enum} from 'ts-enum-util';
import {IdentifiersMap} from '@compiler/lexer/lexer';

export enum CStructAlign {
  PACKED = 'packed',
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
  | CStructLikeSpecifiers
);

export type CCompilerIdentifier = (
  CCompilerKeyword
  | CCompilerTypeIdentifier
);

export const CCOMPILER_STRUCT_LIKE_SPECIFIERS = $enum(CStructLikeSpecifiers).getValues();
export const CCOMPILER_FUNCTION_SPECIFIERS = $enum(CFunctionSpecifier).getValues();
export const CCOMPILER_TYPE_SPECIFIERS = $enum(CTypeSpecifier).getValues();
export const CCOMPILER_TYPE_QUALIFIERS = $enum(CTypeQualifier).getValues();
export const CCOMPILER_STORAGE_CLASS_SPECIFIERS = $enum(CStorageClassSpecifier).getValues();
export const CCOMPILER_UNARY_OPERATORS = $enum(CUnaryCastOperator).getValues();
export const CCOMPILER_ASSIGN_OPERATORS = $enum(CAssignOperator).getValues();

export const CCOMPILER_IDENTIFIERS_MAP: IdentifiersMap = [
  CCompilerKeyword,
  CTypeSpecifier,
  CTypeQualifier,
  CStorageClassSpecifier,
  CFunctionSpecifier,
  CCompilerKeyword,
].reduce(
  (acc, enumerator) => {
    Object.assign(
      acc,
      R.fromPairs(
        $enum(enumerator)
          .getValues()
          .map((value) => [value, value]),
      ),
    );

    return acc;
  },
  {},
);
