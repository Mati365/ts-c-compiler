import {CompilerError} from '@compiler/core/shared/CompilerError';

export function fixme(str: string) {
  return `[[ fixme ]] ${str}`;
}

export enum CTypeCheckErrorCode {
  TYPECHECK_ERROR,
  UNKNOWN_SPECIFIERS_KEYWORD,
  UNKNOWN_QUALIFIERS_KEYWORD,
  INCORRECT_VOID_SPECIFIERS,
  INCORRECT_TYPE_SPECIFIERS,
  REDEFINITION_OF_TYPE,
  REDEFINITION_OF_STRUCT_ENTRY,
  UNABLE_TO_EXTRACT_STRUCT_TYPE,
  UNKNOWN_DECLARATOR_ENTRY_IDENTIFIER,
  UNKNOWN_DECLARATOR_ENTRY_TYPE,
}

export const C_TYPE_CHECK_ERROR_TRANSLATIONS: Record<CTypeCheckErrorCode, string> = {
  [CTypeCheckErrorCode.TYPECHECK_ERROR]: 'Typecheck error!',
  [CTypeCheckErrorCode.UNKNOWN_SPECIFIERS_KEYWORD]: 'Unknown specifier!',
  [CTypeCheckErrorCode.UNKNOWN_QUALIFIERS_KEYWORD]: 'Unknown qualifier!',
  [CTypeCheckErrorCode.INCORRECT_TYPE_SPECIFIERS]: 'Incorrect type specifiers!',
  [CTypeCheckErrorCode.INCORRECT_VOID_SPECIFIERS]: 'Wrong specifiers used with void!',
  [CTypeCheckErrorCode.REDEFINITION_OF_TYPE]: 'Redefinition of type %{name}!',
  [CTypeCheckErrorCode.REDEFINITION_OF_STRUCT_ENTRY]: 'Redefinition of struct entry %{name}!',
  [CTypeCheckErrorCode.UNABLE_TO_EXTRACT_STRUCT_TYPE]: fixme('Unable to extract struct type!'),
  [CTypeCheckErrorCode.UNKNOWN_DECLARATOR_ENTRY_IDENTIFIER]: fixme('Unknown declarator entry identifier!'),
  [CTypeCheckErrorCode.UNKNOWN_DECLARATOR_ENTRY_TYPE]: fixme('Unknown declarator entry type!'),
};

/**
 * Error thrown during AST generation phase
 *
 * @export
 * @class CTypeCheckError
 * @extends {CompilerError<CTypeCheckErrorCode, void>}
 */
export class CTypeCheckError extends CompilerError<CTypeCheckErrorCode, void> {
  constructor(code: CTypeCheckErrorCode, meta?: object) {
    super(C_TYPE_CHECK_ERROR_TRANSLATIONS, code, null, meta);
  }
}
