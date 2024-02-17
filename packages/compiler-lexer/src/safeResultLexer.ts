import * as E from 'fp-ts/Either';
import { CompilerError } from '@ts-cc/core';

import { lexer, type LexerConfig } from './lexer';
import type { Token } from './tokens';

/**
 * Lexer that returns Result instead of throwable call
 */
export const safeResultLexer =
  (config: LexerConfig) =>
  (code: string): E.Either<CompilerError[], Token[]> => {
    try {
      return E.right(Array.from(lexer(config)(code)));
    } catch (e) {
      console.error(e);
      return E.left([e]);
    }
  };
