import {lexer} from '@compiler/lexer/lexer';

import {
  Token,
  TokenType,
  TokenLocation,
} from '@compiler/lexer/tokens';

import {
  NumberToken,
  SizeOverrideToken,
  BranchAddressingTypeToken,
  FloatNumberToken,
  RegisterToken,
} from './tokens';

/**
 * Set of all ASM related parsers
 */
export const TOKEN_PARSERS: {
  [parser: number]: (token: string, loc?: TokenLocation) => boolean|Token,
} = Object.freeze(
  {
    /** NUMBER */
    [TokenType.NUMBER]: NumberToken.parse,

    /** FLOAT NUMBER */
    [TokenType.FLOAT_NUMBER]: FloatNumberToken.parse,

    /** KEYWORD */
    [TokenType.KEYWORD]: (token: string, loc?: TokenLocation): boolean|Token => (
      RegisterToken.parse(token, loc)
        ?? BranchAddressingTypeToken.parse(token, loc)
        ?? SizeOverrideToken.parse(token, loc)
        ?? true
    ),
  },
);

/**
 * Lexer for assembler lang
 *
 * @export
 * @param {string} code
 * @param {boolean} [appendEOF=true]
 * @param {boolean} [signOperatorsAsSeparateTokens=false]
 * @returns {IterableIterator<Token>}
 */
export function asmLexer(
  code: string,
  appendEOF: boolean = true,
  signOperatorsAsSeparateTokens: boolean = false,
): IterableIterator<Token> {
  return lexer(
    TOKEN_PARSERS,
    code,
    appendEOF,
    signOperatorsAsSeparateTokens,
  );
}
