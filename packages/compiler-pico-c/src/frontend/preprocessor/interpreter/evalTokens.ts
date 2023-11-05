import { Token, TokenType } from '@ts-c-compiler/lexer';
import { CPreprocessorScope } from './preprocessTokens';

import type { CPreprocessorMacroArgToken } from './types';
import { execMacro } from './execMacro';
import { CPreprocessorError, CPreprocessorErrorCode } from '../grammar';

export const evalTokens =
  (scope: CPreprocessorScope) =>
  (tokens: Token[]): Token[] => {
    let newTokens = [...tokens];

    for (let i = 0; i < newTokens.length; ++i) {
      const token = newTokens[i];
      const macro = scope.macros[token.text];

      if (!macro) {
        continue;
      }

      const start = i;
      const args: CPreprocessorMacroArgToken[] = [];

      if (
        newTokens[i + 1]?.text === '(' &&
        newTokens[i + 1].loc.column - token.loc.column - token.text.length === 0
      ) {
        i += 2;

        for (; i < newTokens.length; ++i) {
          args.push(newTokens[i]);

          if (newTokens[i + 1]?.text === ')') {
            ++i;
            break;
          }

          if (newTokens[i + 1]?.type === TokenType.COMMA) {
            i++;
          } else {
            throw new CPreprocessorError(
              CPreprocessorErrorCode.ARG_PARSER_ERROR,
              token.loc,
              { macro: token.text },
            );
          }
        }
      }

      newTokens = [
        ...newTokens.slice(0, start),
        ...execMacro(args)(macro),
        ...newTokens.slice(i + 1),
      ];

      i = 0; // allow recursive macro execution
    }

    return newTokens;
  };
