import {CompilerError} from '@compiler/core/shared/CompilerError';
import {TokenLocation} from '@compiler/lexer/tokens';

export enum GrammarErrorCode {
  SYNTAX_ERROR,
}

export const GRAMMAR_ERROR_TRANSLATIONS: Record<GrammarErrorCode, string> = {
  [GrammarErrorCode.SYNTAX_ERROR]: 'Syntax error!',
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
