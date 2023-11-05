import type { Token } from '@ts-c-compiler/lexer';

export type CPreprocessorMacroArgToken = Token;

export type CPreprocessorMacro = {
  args: string[];
  expression: Token[];
};
