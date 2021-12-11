import {CCOMPILER_IDENTIFIERS_MAP} from '@compiler/x86-nano-c/constants';

import {
  FloatNumberToken,
  NumberToken,
  TokenType,
} from '@compiler/lexer/tokens';

import {
  LexerConfig,
  TokenParsersMap,
  TokenTerminalCharactersMap,
  TERMINAL_CHARACTERS,
} from '@compiler/lexer/lexer';

import {safeResultLexer} from '@compiler/lexer/safeResultLexer';
import {
  cComentParser,
  cMergeNumbersTokens,
} from './parsers';

export const CCOMPILER_TERMINAL_CHARACTERS: TokenTerminalCharactersMap = {
  ...TERMINAL_CHARACTERS,
  '%': TokenType.MOD,
  '.': TokenType.DOT,
};

export const CCOMPILER_TOKEN_PARSERS: TokenParsersMap = {
  [TokenType.NUMBER]: NumberToken.parse,
  [TokenType.FLOAT_NUMBER]: FloatNumberToken.parse,
  [TokenType.KEYWORD]: () => true,
};

export type CLexerConfig = LexerConfig;

/**
 * Lexer for C-like language
 *
 * @export
 * @param {CLexerConfig} config
 * @param {string} code
 * @returns
 */
export function clexer(config: CLexerConfig, code: string) {
  const result = safeResultLexer(
    {
      identifiers: CCOMPILER_IDENTIFIERS_MAP,
      tokensParsers: CCOMPILER_TOKEN_PARSERS,
      terminalCharacters: CCOMPILER_TERMINAL_CHARACTERS,
      commentParser: cComentParser,
      consumeBracketContent: false,
      ignoreEOL: true,
      ignoreSpecifiersCase: false,
      signOperatorsAsSeparateTokens: true,
      ...config,
    },
    code,
  );

  return result.map(cMergeNumbersTokens);
}
