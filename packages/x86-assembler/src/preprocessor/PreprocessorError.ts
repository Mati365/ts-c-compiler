import { CompilerError } from '@ts-c-compiler/core';
import { TokenLocation } from '@ts-c-compiler/lexer';

export enum PreprocessorErrorCode {
  GRAMMAR_SYNTAX_ERROR,
  EXPRESSION_MISMATCH_ARGS_TYPES,
  INCORRECT_EXPRESSION,
  INCORRECT_MATH_EXPRESSION,
  INCORRECT_ARGS_LIST,
  UNTERMINATED_ARGS_LIST,
  UNKNOWN_MACRO_VARIABLE,
  INCORRECT_VALUE_EXPRESSION,
  MACRO_ARGS_LIST_MISMATCH,
  MACRO_ALREADY_EXISTS,
  VARIABLE_ALREADY_EXISTS_IN_CURRENT_SCOPE,
}

/* eslint-disable max-len */
export const PREPROCESSOR_ERROR_TRANSLATIONS: Record<
  PreprocessorErrorCode,
  string
> = {
  [PreprocessorErrorCode.GRAMMAR_SYNTAX_ERROR]: 'Grammar syntax error!',
  [PreprocessorErrorCode.INCORRECT_VALUE_EXPRESSION]:
    'Incorrect value expression! Too many tokens!',
  [PreprocessorErrorCode.UNKNOWN_MACRO_VARIABLE]:
    'Unknown macro variable %{name}!',
  [PreprocessorErrorCode.EXPRESSION_MISMATCH_ARGS_TYPES]:
    'Mismatch expression args types!',
  [PreprocessorErrorCode.INCORRECT_EXPRESSION]: 'Incorrect expression!',
  [PreprocessorErrorCode.MACRO_ALREADY_EXISTS]: 'Macro %{name} already exists!',
  [PreprocessorErrorCode.VARIABLE_ALREADY_EXISTS_IN_CURRENT_SCOPE]:
    'Variable %{name} already exists in current scope!',
  [PreprocessorErrorCode.INCORRECT_MATH_EXPRESSION]:
    'Incorrect math "%{expression}" expression!',
  [PreprocessorErrorCode.INCORRECT_ARGS_LIST]: 'Incorrect args list syntax!',
  [PreprocessorErrorCode.UNTERMINATED_ARGS_LIST]: 'Unterminated args list!',
  [PreprocessorErrorCode.MACRO_ARGS_LIST_MISMATCH]:
    'Incorrect macro %{name} call args count! Provided %{provided} but expected %{expected}!',
};
/* eslint-enable max-len */

/**
 * Error shown in preprocessor
 */
export class PreprocessorError extends CompilerError<
  PreprocessorErrorCode,
  TokenLocation
> {
  constructor(code: PreprocessorErrorCode, loc?: TokenLocation, meta?: object) {
    super(PREPROCESSOR_ERROR_TRANSLATIONS, code, loc, meta);
    this.name = 'Preprocessor';
  }
}
