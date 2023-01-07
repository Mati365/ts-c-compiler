import { lexer, LexerConfig, TokenParsersMap } from '@compiler/lexer/lexer';
import { safeResultLexer } from '@compiler/lexer/safeResultLexer';

import { Result } from '@compiler/core/monads/Result';
import { LexerError } from '@compiler/lexer/shared/LexerError';
import {
  Token,
  TokenType,
  TokenLocation,
  NumberToken,
  FloatNumberToken,
} from '@compiler/lexer/tokens';

import {
  SizeOverrideToken,
  BranchAddressingTypeToken,
  RegisterToken,
} from './tokens';

/**
 * Set of all ASM related parsers
 */
export const TOKEN_PARSERS: TokenParsersMap = Object.freeze({
  /** NUMBER */
  [TokenType.NUMBER]: NumberToken.parse,

  /** FLOAT NUMBER */
  [TokenType.FLOAT_NUMBER]: FloatNumberToken.parse,

  /** KEYWORD */
  [TokenType.KEYWORD]: (token: string, loc?: TokenLocation): boolean | Token =>
    RegisterToken.parse(token, loc) ??
    BranchAddressingTypeToken.parse(token, loc) ??
    SizeOverrideToken.parse(token, loc) ??
    true,
});

/**
 * Lexer for assembler lang
 */
export function asmLexer(
  lexerConfig: LexerConfig,
  code: string,
): IterableIterator<Token> {
  return lexer(
    {
      tokensParsers: TOKEN_PARSERS,
      ...lexerConfig,
    },
    code,
  );
}

/**
 * ASM lexer that does not throw errors
 */
export function safeResultAsmLexer(
  lexerConfig: LexerConfig,
  code: string,
): Result<Token[], LexerError[]> {
  return safeResultLexer(
    {
      tokensParsers: TOKEN_PARSERS,
      ...lexerConfig,
    },
    code,
  );
}
