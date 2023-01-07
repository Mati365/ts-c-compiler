import { TokenLocation } from '@compiler/lexer/tokens';

/**
 * Location of single node (begin, end)
 */
export class NodeLocation {
  constructor(readonly start: TokenLocation, readonly end: TokenLocation) {}

  static fromTokenLoc(tokenLoc: TokenLocation): NodeLocation {
    return new NodeLocation(tokenLoc, tokenLoc);
  }
}
