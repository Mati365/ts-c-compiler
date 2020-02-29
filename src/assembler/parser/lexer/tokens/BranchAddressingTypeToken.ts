/**
 *
 */
import * as R from 'ramda';

import {TokenLocation} from './TokenLocation';
import {
  TokenType,
  Token,
  TokenKind,
} from './Token';

import {BranchAddressingType} from '../../../types';

/**
 * Token which matches NEAR/SHORT/FAR branch flow controls
 *
 * @see {@link https://csiflabs.cs.ucdavis.edu/~ssdavis/50/att-syntax.htm}
 *
 * @export
 * @class BranchAddressingTypeToken
 * @extends {Token<BranchAddressingType>}
 */
export class BranchAddressingTypeToken extends Token<BranchAddressingType> {
  constructor(
    addressingType: BranchAddressingType,
    loc: TokenLocation,
  ) {
    super(
      TokenType.KEYWORD,
      TokenKind.BRANCH_ADDRESSING_TYPE,
      addressingType,
      loc,
      addressingType,
    );
  }

  /**
   * @static
   * @param {string} token
   * @param {TokenLocation} loc
   * @returns {RegisterToken}
   * @memberof RegisterToken
   */
  static parse(token: string, loc: TokenLocation): BranchAddressingTypeToken {
    const addressingType: BranchAddressingType = BranchAddressingType[R.toUpper(token)];
    if (addressingType)
      return new BranchAddressingTypeToken(addressingType, loc);

    return null;
  }
}
