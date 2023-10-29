import { Token } from '@ts-c/lexer';
import { TreeNode } from '@ts-c/grammar';

import { NodeLocation } from '@ts-c/grammar';
import { ASTAsmParser, ASTAsmTree } from './ASTAsmParser';
import { ASTNodeKind } from './types';

/**
 * Set of multiple tokens that crates tree
 */
export class ASTAsmNode extends TreeNode<ASTNodeKind> {
  constructor(
    kind: ASTNodeKind,
    loc: NodeLocation,
    children: ASTAsmNode[] = null,
  ) {
    super(kind, loc, children);
  }

  /* eslint-disable class-methods-use-this */
  clone(): ASTAsmNode {
    throw new Error('Unimplemented clone in TreeNode!');
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  static parse(
    token: Token,
    parser: ASTAsmParser,
    tree: ASTAsmTree,
  ): ASTAsmNode {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

export const KindASTAsmNode = (kind: ASTNodeKind) =>
  class extends ASTAsmNode {
    constructor(loc: NodeLocation, children: ASTAsmNode[] = null) {
      super(kind, loc, children);
    }
  };
