import {CompilerError} from '@compiler/core/shared/CompilerError';
import {TokenLocation} from '@compiler/lexer/tokens';

export enum PreprocessorErrorCode {
  EXPRESSION_MISMATCH_ARGS_TYPES,
  INCORRECT_EXPRESSION,
  INCORRECT_MATH_EXPRESSION,
  INCORRECT_ARGS_LIST,
  UNTERMINATED_ARGS_LIST,
  UNKNOWN_MACRO_VARIABLE,
  INCORRECT_VALUE_EXPRESSION,
  MACRO_ARGS_LIST_MISMATCH,
  MACRO_ALREADY_EXISTS,
}

/* eslint-disable max-len */
export const PREPROCESSOR_ERROR_TRANSLATIONS: {[key in PreprocessorErrorCode]: string} = {
  [PreprocessorErrorCode.INCORRECT_VALUE_EXPRESSION]: 'Incorrect value expression! Too many tokens!',
  [PreprocessorErrorCode.UNKNOWN_MACRO_VARIABLE]: 'Unknown macro variable %{name}!',
  [PreprocessorErrorCode.EXPRESSION_MISMATCH_ARGS_TYPES]: 'Mismatch expression args types!',
  [PreprocessorErrorCode.INCORRECT_EXPRESSION]: 'Incorrect expression!',
  [PreprocessorErrorCode.MACRO_ALREADY_EXISTS]: 'Macro %{name} already exists!',
  [PreprocessorErrorCode.INCORRECT_MATH_EXPRESSION]: 'Incorrect math "%{expression}" expression!',
  [PreprocessorErrorCode.INCORRECT_ARGS_LIST]: 'Incorrect args list syntax!',
  [PreprocessorErrorCode.UNTERMINATED_ARGS_LIST]: 'Unterminated args list!',
  [PreprocessorErrorCode.MACRO_ARGS_LIST_MISMATCH]: 'Incorrect macro %{name} call args count! Provided %{provided} but expected %{expected}!',
};
/* eslint-enable max-len */

/**
 * Error shown in preprocessor
 *
 * @export
 * @class PreprocessorError
 * @extends {PreprocessorError<PreprocessorErrorCode, TokenLocation>}
 */
export class PreprocessorError extends CompilerError<PreprocessorErrorCode, TokenLocation> {
  constructor(code: PreprocessorErrorCode, loc?: TokenLocation, meta?: object) {
    super(PREPROCESSOR_ERROR_TRANSLATIONS, code, loc, meta);
    this.name = 'Preprocessor';
  }
}
