import {Result, err, ok} from '@compiler/core/monads/Result';
import {CompilerError} from '@compiler/core/shared/CompilerError';

import {lexer, LexerConfig} from './lexer';
import {Token} from './tokens';

/**
 * Lexer that returns Result instead of throwable call
 *
 * @export
 * @param {LexerConfig} config
 * @param {string} code
 * @returns {Result<Error, LexerError[]>}
 */
export function safeResultLexer(config: LexerConfig, code: string): Result<Token[], CompilerError[]> {
  try {
    return ok(
      Array.from(
        lexer(config, code),
      ),
    );
  } catch (e) {
    console.error(e);
    return err(
      [
        e,
      ],
    );
  }
}
