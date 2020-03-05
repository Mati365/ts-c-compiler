import {TokenLocation, Token} from '@compiler/lexer/tokens';
import {ASTParser, ASTTree} from './ASTParser';
import {ASTNodeKind} from './types';

export class ASTNodeLocation {
  constructor(
    public readonly start: TokenLocation,
    public readonly end: TokenLocation,
  ) {}

  static fromTokenLoc(tokenLoc: TokenLocation): ASTNodeLocation {
    return new ASTNodeLocation(tokenLoc, tokenLoc);
  }
}

/**
 * Set of multiple tokens that crates tree
 *
 * @export
 * @class ASTNode
 */
export class ASTNode {
  constructor(
    public readonly kind: ASTNodeKind,
    public readonly loc: ASTNodeLocation,
    public readonly children: ASTNode[] = null,
  ) {}

  /* eslint-disable @typescript-eslint/no-unused-vars */
  static parse(token: Token, parser: ASTParser, tree: ASTTree): ASTNode {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */

  /* eslint-disable class-methods-use-this */
  clone(): ASTNode {
    throw new Error('Unimplemented clone in ASTNode!');
  }

  toString(): string {
    return null;
  }
  /* eslint-enable class-methods-use-this */
}

export const KindASTNode = (kind: ASTNodeKind) => class extends ASTNode {
  constructor(loc: ASTNodeLocation, children: ASTNode[] = null) {
    super(kind, loc, children);
  }
};
