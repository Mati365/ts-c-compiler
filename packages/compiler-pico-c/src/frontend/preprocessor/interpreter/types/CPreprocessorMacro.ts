import type { Token } from '@ts-c-compiler/lexer';

export type CPreprocessorMacroArgTokens = Token[];

export type CPreprocessorMacro = {
  args: string[];
  expression: Token[];
};
