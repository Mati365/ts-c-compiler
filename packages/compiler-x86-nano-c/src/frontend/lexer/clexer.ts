import {
  LexerConfig,
  TokenParsersMap,
  TokenTerminalCharactersMap,
  TERMINAL_CHARACTERS,
} from '@compiler/lexer/lexer';

import {FloatNumberToken, NumberToken, TokenType} from '@compiler/lexer/tokens';
import {safeResultLexer} from '@compiler/lexer/safeResultLexer';

import {CCOMPILER_IDENTIFIERS_MAP} from '../../constants';
import {ccomentParser} from './ccommentParser';

export const CCOMPILER_TERMINAL_CHARACTERS: TokenTerminalCharactersMap = {
  ...TERMINAL_CHARACTERS,
  '%': TokenType.MOD,
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
  return safeResultLexer(
    {
      identifiers: CCOMPILER_IDENTIFIERS_MAP,
      tokensParsers: CCOMPILER_TOKEN_PARSERS,
      terminalCharacters: CCOMPILER_TERMINAL_CHARACTERS,
      commentParser: ccomentParser,
      consumeBracketContent: false,
      ignoreEOL: true,
      signOperatorsAsSeparateTokens: true,
      ...config,
    },
    code,
  );
}
