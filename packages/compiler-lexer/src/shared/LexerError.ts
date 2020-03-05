import {CompilerError} from '@compiler/core/shared/CompilerError';
import {TokenLocation} from '../tokens';

export enum LexerErrorCode {
  UNKNOWN_TOKEN,
}

export const LEXER_ERROR_TRANSLATIONS: {[key in LexerErrorCode]: string} = {
  [LexerErrorCode.UNKNOWN_TOKEN]: 'Unknown token "%{token}"!',
};

/**
 * Error thrown durin lexer phase!
 *
 * @export
 * @class LexerError
 * @extends {CompilerError<LexerErrorCode, TokenLocation>}
 */
export class LexerError extends CompilerError<LexerErrorCode, TokenLocation> {
  constructor(code: LexerErrorCode, loc?: TokenLocation, meta?: object) {
    super(LEXER_ERROR_TRANSLATIONS, code, loc, meta);
  }
}
