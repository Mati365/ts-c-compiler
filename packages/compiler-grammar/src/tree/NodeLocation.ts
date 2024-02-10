import { TokenLocation } from '@ts-c-compiler/lexer';

/**
 * Location of single node (begin, end)
 */
export class NodeLocation {
  constructor(
    readonly start: TokenLocation,
    readonly end: TokenLocation,
  ) {}

  static fromTokenLoc(tokenLoc: TokenLocation): NodeLocation {
    return new NodeLocation(tokenLoc, tokenLoc);
  }
}
