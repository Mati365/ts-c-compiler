import { CompilerError } from '@compiler/core/shared/CompilerError';
import { TokenLocation } from '@compiler/lexer/shared';

export enum CGrammarErrorCode {
  SYNTAX_ERROR,
  INCORRECT_CHAR_LITERAL_LENGTH,
  EMPTY_ENUM_DEFINITION,
  BREAK_STMT_NOT_WITHIN_LOOP_OR_SWITCH,
  CONTINUE_STMT_NOT_WITHIN_LOOP_OR_SWITCH,
}

export const C_GRAMMAR_ERROR_TRANSLATIONS: Record<CGrammarErrorCode, string> = {
  [CGrammarErrorCode.SYNTAX_ERROR]: 'Syntax error!',
  [CGrammarErrorCode.INCORRECT_CHAR_LITERAL_LENGTH]:
    'Incorrect char "%{text}" literal length!',
  [CGrammarErrorCode.EMPTY_ENUM_DEFINITION]: 'Empty enum definition!',
  [CGrammarErrorCode.BREAK_STMT_NOT_WITHIN_LOOP_OR_SWITCH]:
    'Break stmt should be placed within for-loop or switch!',
  [CGrammarErrorCode.CONTINUE_STMT_NOT_WITHIN_LOOP_OR_SWITCH]:
    'Continue stmt should be placed within for-loop or switch!',
};

/**
 * Error thrown during AST generation phase
 */
export class CGrammarError extends CompilerError<
  CGrammarErrorCode,
  TokenLocation
> {
  constructor(code: CGrammarErrorCode, loc?: TokenLocation, meta?: object) {
    super(C_GRAMMAR_ERROR_TRANSLATIONS, code, loc, meta);
  }
}
