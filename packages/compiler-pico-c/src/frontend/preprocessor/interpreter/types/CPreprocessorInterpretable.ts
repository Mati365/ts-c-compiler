import type { Token } from '@ts-c-compiler/lexer';
import type { CPreprocessorMacro } from './CPreprocessorMacro';

export type CInterpreterContext = {
  defineMacro(name: string, macro: CPreprocessorMacro): void;
  evalTokens(tokens: Token[]): Token[];
  appendFinalTokens(tokens: Token[]): void;
};

export interface CPreprocessorInterpretable {
  exec(interpreter: CInterpreterContext): void;
}
