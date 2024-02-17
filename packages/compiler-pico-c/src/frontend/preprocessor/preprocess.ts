import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import type { Token } from '@ts-cc/lexer';

import { CPreprocessorError, CPreprocessorErrorCode } from './grammar';
import { interpret, type CPreprocessorConfig } from './interpreter';

export const safePreprocess =
  (config: CPreprocessorConfig) =>
  (tokens: Token[]): E.Either<CPreprocessorError[], Token[]> => {
    try {
      return pipe(tokens, interpret(config), E.right);
    } catch (e) {
      e.code = e.code ?? CPreprocessorErrorCode.SYNTAX_ERROR;

      return E.left([e]);
    }
  };
