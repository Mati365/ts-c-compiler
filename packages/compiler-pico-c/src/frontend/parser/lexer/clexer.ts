import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import { safeResultLexer } from '@ts-c-compiler/lexer';
import { FloatNumberToken, NumberToken, TokenType } from '@ts-c-compiler/lexer';
import {
  LexerConfig,
  TokenParsersMap,
  TokenTerminalCharactersMap,
  TERMINAL_CHARACTERS,
} from '@ts-c-compiler/lexer';

import { cComentParser, cMergeNumbersTokens } from './parsers';
import { CCOMPILER_IDENTIFIERS_MAP } from '#constants';

export const CCOMPILER_TERMINAL_CHARACTERS: TokenTerminalCharactersMap = {
  ...TERMINAL_CHARACTERS,
  '%': TokenType.MOD,
  '.': TokenType.DOT,
  '~': TokenType.BIT_NOT,
};

export const CCOMPILER_TOKEN_PARSERS: TokenParsersMap = {
  [TokenType.NUMBER]: NumberToken.parse,
  [TokenType.FLOAT_NUMBER]: FloatNumberToken.parse,
  [TokenType.KEYWORD]: () => true,
};

export type CLexerConfig = LexerConfig;

/**
 * Lexer for C-like language
 */
export const clexer = (config: CLexerConfig) => (code: string) =>
  pipe(
    code,
    safeResultLexer({
      identifiers: CCOMPILER_IDENTIFIERS_MAP,
      tokensParsers: CCOMPILER_TOKEN_PARSERS,
      terminalCharacters: CCOMPILER_TERMINAL_CHARACTERS,
      commentParser: cComentParser,
      consumeBracketContent: false,
      ignoreEOL: true,
      ignoreSpecifiersCase: false,
      signOperatorsAsSeparateTokens: true,
      ...config,
    }),
    E.map(cMergeNumbersTokens),
  );
