import { Token, TokenType } from '@ts-cc/lexer';

import type { CInterpreterScope } from './createInterpreterContext';
import type { CPreprocessorMacroArgTokens } from './types';

import { execMacro } from './execMacro';
import { CPreprocessorError, CPreprocessorErrorCode } from '../grammar';
import { concatTokens } from './concatTokens';

export const evalTokens =
  (scope: CInterpreterScope) =>
  (tokens: Token[]): Token[] => {
    let newTokens = [...tokens];

    for (let i = 0; i < newTokens.length; ++i) {
      const token = newTokens[i];
      const macro = scope.macros[token.text];

      if (!macro) {
        continue;
      }

      const start = i;
      const args: CPreprocessorMacroArgTokens[] = [];

      if (
        newTokens[i + 1]?.text === '(' &&
        newTokens[i + 1].loc.column - token.loc.column - token.text.length === 0
      ) {
        let nesting = 0;
        let arg: CPreprocessorMacroArgTokens = [];

        i += 2;

        for (; i < newTokens.length; ++i) {
          const nextToken = newTokens[i + 1];

          arg.push(newTokens[i]);

          if (newTokens[i].text === '(') {
            nesting++;
          } else if (newTokens[i].text === ')') {
            nesting--;
          }

          if (!nextToken) {
            throw new CPreprocessorError(
              CPreprocessorErrorCode.ARG_PARSER_ERROR,
              token.loc,
              {
                macro: token.text,
              },
            );
          }

          if (!nesting) {
            if (nextToken.text === ')') {
              args.push(evalTokens(scope)(arg));
              arg = [];
              i++;
              break;
            }

            if (nextToken.type === TokenType.COMMA) {
              args.push(evalTokens(scope)(arg));
              arg = [];
              i++;
            }
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

    return concatTokens(newTokens);
  };
