import type { Token } from '@ts-c-compiler/lexer';
import type { ASTCDefineArg } from '../../ast';

export type CPreprocessorMacroArgTokens = Token[];

export type CPreprocessorMacro = {
  args: ASTCDefineArg[];
  expression: Token[];
};
