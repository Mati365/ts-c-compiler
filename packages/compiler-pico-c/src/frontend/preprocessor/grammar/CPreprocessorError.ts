import { CompilerError } from '@ts-c-compiler/core';
import { TokenLocation } from '@ts-c-compiler/lexer';

export enum CPreprocessorErrorCode {
  SYNTAX_ERROR,
  ARG_PARSER_ERROR,
  MISSING_ENDIF,
  INCORRECT_VALUE_EXPRESSION,
  INCORRECT_EXPRESSION,
  EXPRESSION_MISMATCH_ARGS_TYPES,
  CANNOT_INCLUDE_FILE,
}

export const C_PREPROCESSOR_ERROR_TRANSLATIONS: Record<CPreprocessorErrorCode, string> = {
  [CPreprocessorErrorCode.SYNTAX_ERROR]: 'Syntax error!',
  [CPreprocessorErrorCode.ARG_PARSER_ERROR]: 'Arg parser error for macro "%{macro}"!',
  [CPreprocessorErrorCode.MISSING_ENDIF]: 'Missing endif!',
  [CPreprocessorErrorCode.INCORRECT_VALUE_EXPRESSION]: 'Incorrect value expression!',
  [CPreprocessorErrorCode.INCORRECT_EXPRESSION]: 'Incorrect expression!',
  [CPreprocessorErrorCode.EXPRESSION_MISMATCH_ARGS_TYPES]:
    'Expression mismatch args types!',
  [CPreprocessorErrorCode.CANNOT_INCLUDE_FILE]: 'Cannot include file "%{name}"!',
};

export class CPreprocessorError extends CompilerError<
  CPreprocessorErrorCode,
  TokenLocation
> {
  constructor(code: CPreprocessorErrorCode, loc?: TokenLocation, meta?: object) {
    super(C_PREPROCESSOR_ERROR_TRANSLATIONS, code, loc, meta);
  }
}
