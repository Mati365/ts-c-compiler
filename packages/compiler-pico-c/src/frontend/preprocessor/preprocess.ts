import * as E from 'fp-ts/Either';

import type { Token } from '@ts-c-compiler/lexer';
import { CPreprocessorError } from './grammar';
import { CPreprocessorInterpreter } from './CPreprocessorInterpreter';

export const safePreprocess = (
  tokens: Token[],
): E.Either<CPreprocessorError[], Token[]> =>
  new CPreprocessorInterpreter().parse(tokens);
