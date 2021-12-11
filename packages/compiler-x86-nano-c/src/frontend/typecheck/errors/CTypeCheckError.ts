import {CompilerError} from '@compiler/core/shared/CompilerError';

export enum CTypeCheckErrorCode {
  UNKNOWN_SPECIFIERS_KEYWORD,
  UNKNOWN_QUALIFIERS_KEYWORD,
  INCORRECT_VOID_SPECIFIERS,
  INCORRECT_TYPE_SPECIFIERS,
}

export const C_TYPE_CHECK_ERROR_TRANSLATIONS: Record<CTypeCheckErrorCode, string> = {
  [CTypeCheckErrorCode.UNKNOWN_SPECIFIERS_KEYWORD]: 'Unknown specifier!',
  [CTypeCheckErrorCode.UNKNOWN_QUALIFIERS_KEYWORD]: 'Unknown qualifier!',
  [CTypeCheckErrorCode.INCORRECT_TYPE_SPECIFIERS]: 'Incorrect type specifiers!',
  [CTypeCheckErrorCode.INCORRECT_VOID_SPECIFIERS]: 'Wrong specifiers used with void!',
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
