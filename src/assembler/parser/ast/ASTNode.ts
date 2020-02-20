import {TokenLocation, Token} from '../lexer/tokens';
import {ASTParser} from './ASTParser';
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
  static parse(token: Token, parser: ASTParser, astNodes: ASTNode[]): ASTNode {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

export const KindASTNode = (kind: ASTNodeKind) => class extends ASTNode {
  constructor(loc: ASTNodeLocation, children: ASTNode[] = null) {
    super(kind, loc, children);
  }
};
