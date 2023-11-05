import { Token } from '@ts-c-compiler/lexer';
import { CPreprocessorScope } from './preprocessTokens';

export const evalTokens =
  (scope: CPreprocessorScope) =>
  (tokens: Token[]): Token[] => {
    let newTokens = [...tokens];

    for (let i = 0; i < newTokens.length; ++i) {
      const token = newTokens[i];
      const macro = scope.macros[token.text];

      if (macro) {
        newTokens = [
          ...newTokens.slice(0, i),
          ...macro.expression,
          ...newTokens.slice(i + 1),
        ];
      }
    }

    return newTokens;
  };
