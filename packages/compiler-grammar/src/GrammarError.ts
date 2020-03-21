import {CompilerError} from '@compiler/core/shared/CompilerError';
import {TokenLocation} from '@compiler/lexer/tokens';

export enum GrammarErrorCode {
  SYNTAX_ERROR,
  INCORRECT_ARGS_LIST,
  UNTERMINATED_ARGS_LIST,
}

export const GRAMMAR_ERROR_TRANSLATIONS: {[key in GrammarErrorCode]: string} = {
  [GrammarErrorCode.SYNTAX_ERROR]: 'Syntax error!',
  [GrammarErrorCode.INCORRECT_ARGS_LIST]: 'Incorrect args list syntax!',
  [GrammarErrorCode.UNTERMINATED_ARGS_LIST]: 'Unterminated args list!',
};

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
