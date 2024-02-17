import type { Token } from '@ts-cc/lexer';
import type { ASTCDefineArg } from '../../ast';

export type CPreprocessorMacroArgTokens = Token[];

export type CPreprocessorMacro = {
  args: ASTCDefineArg[];
  expression: Token[];
};
