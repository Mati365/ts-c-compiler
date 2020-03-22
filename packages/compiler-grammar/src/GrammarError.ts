import {CompilerError} from '@compiler/core/shared/CompilerError';
import {TokenLocation} from '@compiler/lexer/tokens';

export enum GrammarErrorCode {
  SYNTAX_ERROR,
  EXPRESSION_MISMATCH_ARGS_TYPES,
  INCORRECT_EXPRESSION,
  INCORRECT_ARGS_LIST,
  UNTERMINATED_ARGS_LIST,
  UNKNOWN_MACRO_VARIABLE,
  MACRO_ARGS_LIST_MISMATCH,
  MACRO_ALREADY_EXISTS,
}

/* eslint-disable max-len */
export const GRAMMAR_ERROR_TRANSLATIONS: {[key in GrammarErrorCode]: string} = {
  [GrammarErrorCode.UNKNOWN_MACRO_VARIABLE]: 'Unknown macro variable %{name}!',
  [GrammarErrorCode.EXPRESSION_MISMATCH_ARGS_TYPES]: 'Mismatch expression args types!',
  [GrammarErrorCode.INCORRECT_EXPRESSION]: 'Incorrect expression!',
  [GrammarErrorCode.MACRO_ALREADY_EXISTS]: 'Macro %{name} already exists!',
  [GrammarErrorCode.SYNTAX_ERROR]: 'Syntax error!',
  [GrammarErrorCode.INCORRECT_ARGS_LIST]: 'Incorrect args list syntax!',
  [GrammarErrorCode.UNTERMINATED_ARGS_LIST]: 'Unterminated args list!',
  [GrammarErrorCode.MACRO_ARGS_LIST_MISMATCH]: 'Incorrect macro %{name} call args count! Provided %{provided} but expected %{expected}!',
};
/* eslint-enable max-len */

/**
 * Error shown during grammar tokens analyze
 *
 * @export
 * @class GrammarError
 * @extends {CompilerError<GrammarErrorCode, TokenLocation>}
 */
export class GrammarError extends CompilerError<GrammarErrorCode, TokenLocation> {
  constructor(code: GrammarErrorCode, loc?: TokenLocation, meta?: object) {
    super(GRAMMAR_ERROR_TRANSLATIONS, code, loc, meta);
    this.name = 'Grammar';
  }
}
