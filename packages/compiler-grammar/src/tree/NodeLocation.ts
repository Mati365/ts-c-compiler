import {TokenLocation} from '@compiler/lexer/tokens';

/**
 * Location of single node (begin, end)
 *
 * @export
 * @class NodeLocation
 */
export class NodeLocation {
  constructor(
    public readonly start: TokenLocation,
    public readonly end: TokenLocation,
  ) {}

  static fromTokenLoc(tokenLoc: TokenLocation): NodeLocation {
    return new NodeLocation(tokenLoc, tokenLoc);
  }
}
