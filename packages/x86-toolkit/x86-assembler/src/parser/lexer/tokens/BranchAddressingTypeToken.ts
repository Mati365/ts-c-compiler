import * as R from 'ramda';

import {
  TokenLocation,
  TokenType,
  Token,
  TokenKind,
} from '@compiler/lexer/tokens';

import { BranchAddressingType } from '../../../types';

/**
 * Token which matches NEAR/SHORT/FAR branch flow controls
 *
 * @see {@link https://csiflabs.cs.ucdavis.edu/~ssdavis/50/att-syntax.htm}
 */
export class BranchAddressingTypeToken extends Token<BranchAddressingType> {
  constructor(addressingType: BranchAddressingType, loc: TokenLocation) {
    super(
      TokenType.KEYWORD,
      TokenKind.BRANCH_ADDRESSING_TYPE,
      addressingType,
      loc,
      addressingType,
    );
  }

  static parse(token: string, loc: TokenLocation): BranchAddressingTypeToken {
    const addressingType: BranchAddressingType =
      BranchAddressingType[R.toUpper(token)];
    if (addressingType) {
      return new BranchAddressingTypeToken(addressingType, loc);
    }

    return null;
  }
}
