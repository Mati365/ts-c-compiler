import {CompilerError} from '@compiler/core/shared/CompilerError';

export enum CGrammarErrorCode {
  SYNTAX_ERROR,
  EMPTY_ENUM_DEFINITION,
}

export const C_GRAMMAR_ERROR_TRANSLATIONS: Record<CGrammarErrorCode, string> = {
  [CGrammarErrorCode.SYNTAX_ERROR]: 'Syntax error!',
  [CGrammarErrorCode.EMPTY_ENUM_DEFINITION]: 'Empty enum definition!',
};

/**
 * Error thrown during AST generation phase
 *
 * @export
 * @class CGrammarError
 * @extends {CompilerError<LexerErrorCode, TokenLocation>}
 */
export class CGrammarError extends CompilerError<CGrammarErrorCode, void> {
  constructor(code: CGrammarErrorCode, meta?: object) {
    super(C_GRAMMAR_ERROR_TRANSLATIONS, code, null, meta);
  }
}
