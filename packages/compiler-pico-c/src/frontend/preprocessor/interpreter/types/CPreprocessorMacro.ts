import type { Token } from '@ts-c-compiler/lexer';

export type CPreprocessorMacro = {
  args: string[];
  expression: Token[];
};
