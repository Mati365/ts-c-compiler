import {LexerConfig, TokenParsersMap} from '@compiler/lexer/lexer';
import {TokenType} from '@compiler/lexer/tokens';
import {safeResultLexer} from '@compiler/lexer/safeResultLexer';

import {CCOMPILER_IDENTIFIERS_MAP} from '../../constants';
import {ccomentParser} from './ccommentParser';

export const CCOMPILER_TOKEN_PARSERS: TokenParsersMap = {
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
      commentParser: ccomentParser,
      consumeBracketContent: false,
      ignoreEOL: true,
      signOperatorsAsSeparateTokens: true,
      ...config,
    },
    code,
  );
}
