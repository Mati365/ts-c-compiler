import * as E from 'fp-ts/Either';

import { Token } from '@ts-c-compiler/lexer';
import { CPreprocessorError } from './grammar';

export class CPreprocessorInterpreter {
  private defineVars: Record<string, string> = {};

  parse(tokens: Token[]): E.Either<CPreprocessorError[], Token[]> {
    return E.right(tokens);
  }
}
