import { Result, CompilerError, err, ok } from '@ts-c/core';
import { lexer, type LexerConfig } from './lexer';
import type { Token } from './tokens';

/**
 * Lexer that returns Result instead of throwable call
 */
export function safeResultLexer(
  config: LexerConfig,
  code: string,
): Result<Token[], CompilerError[]> {
  try {
    return ok(Array.from(lexer(config, code)));
  } catch (e) {
    console.error(e);
    return err([e]);
  }
}
