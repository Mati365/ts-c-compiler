import { CompilerError } from '@compiler/core/shared/CompilerError';
import { TokenLocation } from './TokenLocation';

export enum LexerErrorCode {
  UNKNOWN_TOKEN,
  UNTERMINATED_STRING,
}

export const LEXER_ERROR_TRANSLATIONS: Record<LexerErrorCode, string> = {
  [LexerErrorCode.UNKNOWN_TOKEN]: 'Unknown token "%{token}"!',
  [LexerErrorCode.UNTERMINATED_STRING]: 'Unterminated string!',
};

/**
 * Error thrown during lexer phase!
 */
export class LexerError extends CompilerError<LexerErrorCode, TokenLocation> {
  constructor(code: LexerErrorCode, loc?: TokenLocation, meta?: object) {
    super(LEXER_ERROR_TRANSLATIONS, code, loc, meta);
  }
}
