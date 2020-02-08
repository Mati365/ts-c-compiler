import {TokenLocation, Token} from '../lexer/tokens';
import {ASTParser} from './ASTParser';

export class ASTNodeLocation {
  public start: TokenLocation;
  public end: TokenLocation;

  constructor(start: TokenLocation, end: TokenLocation) {
    this.start = start;
    this.end = end;
  }

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
  public kind: string;
  public loc: ASTNodeLocation;
  public children: ASTNode[];

  constructor(kind: string, loc: ASTNodeLocation, children: ASTNode[] = []) {
    this.kind = kind;
    this.loc = loc;
    this.children = children || [];
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  static parse(token: Token, parser: ASTParser): ASTNode {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

export const KindASTNode = (kind: string) => class extends ASTNode {
  constructor(loc: ASTNodeLocation, children: ASTNode[] = []) {
    super(kind, loc, children);
  }
};
