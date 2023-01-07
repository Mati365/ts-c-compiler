import * as R from 'ramda';

import {
  TokenLocation,
  TokenType,
  Token,
  TokenKind,
} from '@compiler/lexer/tokens';

import { InstructionArgSize } from '../../../types';

type SizeOverrideTokenValue = {
  byteSize: number;
};

/**
 * Token that prefixes mem address with size
 */
export class SizeOverrideToken extends Token<SizeOverrideTokenValue> {
  constructor(text: string, byteSize: number, loc: TokenLocation) {
    super(TokenType.KEYWORD, TokenKind.BYTE_SIZE_OVERRIDE, text, loc, {
      byteSize,
    });
  }

  /**
   * Matches token with provided size
   */
  static parse(token: string, loc: TokenLocation): SizeOverrideToken {
    const byteSize = InstructionArgSize[R.toUpper(token)];
    if (byteSize) {
      return new SizeOverrideToken(token, byteSize, loc.clone());
    }

    return null;
  }
}
