import * as E from 'fp-ts/Either';

import type { Token } from '@ts-c-compiler/lexer';
import { CPreprocessorError, CPreprocessorErrorCode } from './grammar';
import { CPreprocessorInterpreter } from './interpreter';

export const safePreprocess = (
  tokens: Token[],
): E.Either<CPreprocessorError[], Token[]> => {
  try {
    return E.right(new CPreprocessorInterpreter().reduce(tokens));
  } catch (e) {
    e.code = e.code ?? CPreprocessorErrorCode.SYNTAX_ERROR;

    return E.left([e]);
  }
};
