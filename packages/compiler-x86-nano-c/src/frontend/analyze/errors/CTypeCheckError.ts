import {CompilerError} from '@compiler/core/shared/CompilerError';
import {TokenLocation} from '@compiler/lexer/shared';

export function fixme(str: string) {
  return `[[ fixme ]] ${str}`;
}

export enum CTypeCheckErrorCode {
  TYPECHECK_ERROR,
  EXPECTED_RECEIVE_TYPE,
  INVALID_ARRAY_SIZE,
  UNKNOWN_SPECIFIERS_KEYWORD,
  UNKNOWN_QUALIFIERS_KEYWORD,
  INCORRECT_VOID_SPECIFIERS,
  INCORRECT_TYPE_SPECIFIERS,
  INCORRECT_CONSTANT_EXPR,
  INCORRECT_CONSTANT_EXPR_IDENTIFIER,
  REDEFINITION_OF_TYPE,
  REDEFINITION_OF_STRUCT_ENTRY,
  REDEFINITION_OF_ENUM_ENTRY,
  UNABLE_TO_EXTRACT_STRUCT_TYPE,
  UNKNOWN_DECLARATOR_ENTRY_IDENTIFIER,
  UNKNOWN_DECLARATOR_ENTRY_TYPE,
  UNKNOWN_CONSTANT_EXPR_EVAL_OPERAND,
  UNKNOWN_TYPE,
}

export const C_TYPE_CHECK_ERROR_TRANSLATIONS: Record<CTypeCheckErrorCode, string> = {
  [CTypeCheckErrorCode.TYPECHECK_ERROR]: 'Typecheck error!',
  [CTypeCheckErrorCode.EXPECTED_RECEIVE_TYPE]: 'Expected to receive type %{expected} but received %{received}!',
  [CTypeCheckErrorCode.INVALID_ARRAY_SIZE]: 'Invalid array size!',
  [CTypeCheckErrorCode.UNKNOWN_SPECIFIERS_KEYWORD]: 'Unknown specifier!',
  [CTypeCheckErrorCode.UNKNOWN_QUALIFIERS_KEYWORD]: 'Unknown qualifier!',
  [CTypeCheckErrorCode.INCORRECT_TYPE_SPECIFIERS]: 'Incorrect type specifiers!',
  [CTypeCheckErrorCode.INCORRECT_VOID_SPECIFIERS]: 'Wrong specifiers used with void!',
  [CTypeCheckErrorCode.REDEFINITION_OF_TYPE]: 'Redefinition of type %{name}!',
  [CTypeCheckErrorCode.REDEFINITION_OF_STRUCT_ENTRY]: 'Redefinition of struct entry %{name}!',
  [CTypeCheckErrorCode.REDEFINITION_OF_ENUM_ENTRY]: 'Redefinition of enum entry %{name}!',
  [CTypeCheckErrorCode.INCORRECT_CONSTANT_EXPR]: 'Incorrect constant expression!',
  [CTypeCheckErrorCode.INCORRECT_CONSTANT_EXPR_IDENTIFIER]: 'Incorrect constant expression identifier!',
  [CTypeCheckErrorCode.UNABLE_TO_EXTRACT_STRUCT_TYPE]: fixme('Unable to extract struct type!'),
  [CTypeCheckErrorCode.UNKNOWN_DECLARATOR_ENTRY_IDENTIFIER]: fixme('Unknown declarator entry identifier!'),
  [CTypeCheckErrorCode.UNKNOWN_DECLARATOR_ENTRY_TYPE]: fixme('Unknown declarator entry type!'),
  [CTypeCheckErrorCode.UNKNOWN_CONSTANT_EXPR_EVAL_OPERAND]: fixme('Unknown constant expression operand!'),
  [CTypeCheckErrorCode.UNKNOWN_TYPE]: 'Unknown type named "%{typeName}"!',
};

/**
 * Error thrown during AST generation phase
 *
 * @export
 * @class CTypeCheckError
 * @extends {CompilerError<CTypeCheckErrorCode, TokenLocation>}
 */
export class CTypeCheckError extends CompilerError<CTypeCheckErrorCode, TokenLocation> {
  constructor(code: CTypeCheckErrorCode, loc?: TokenLocation, meta?: object) {
    super(C_TYPE_CHECK_ERROR_TRANSLATIONS, code, loc, meta);
  }
}
