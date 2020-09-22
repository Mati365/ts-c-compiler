import {LexerConfig, TokenParsersMap} from '@compiler/lexer/lexer';
import {TokenType} from '@compiler/lexer/tokens';
import {isNewline} from '@compiler/lexer/utils';
import {safeResultLexer} from '@compiler/lexer/safeResultLexer';

import {CCOMPILER_IDENTIFIERS_MAP} from '../constants';

export const CCOMPILER_TOKEN_PARSERS: TokenParsersMap = {
  [TokenType.KEYWORD]: () => true,
};

/**
 * Parses C style comments like // or \/* *\/
 *
 * @param {string} code
 * @param {number} offset
 * @param {string} character
 * @returns {number}
 */
function ccomentParser(code: string, offset: number, character: string): number {
  // detect inline C commnet
  if (character === '/' && code[offset + 1] === '/') {
    for (offset += 1; offset < code.length; ++offset) {
      if (isNewline(code[offset + 1]))
        break;
    }
    return offset;
  }

  // detect block C comment
  if (character === '/' && code[offset + 1] === '*') {
    for (offset += 1; offset < code.length; ++offset) {
      if (code[offset] === '*' && code[offset + 1] === '/') {
        offset++;
        break;
      }
    }
    return offset;
  }

  return null;
}

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
