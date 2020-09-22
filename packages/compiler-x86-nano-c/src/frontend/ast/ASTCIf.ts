import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';

import {
  ASTCCompilerKind,
  ASTCCompilerNode,
} from './ASTCCompilerNode';

export class ASTCIf extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly test: ASTCCompilerNode,
    public readonly consequent: ASTCCompilerNode,
    public readonly alternate: ASTCCompilerNode = null,
  ) {
    super(ASTCCompilerKind.If, loc);
  }

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<ASTCCompilerNode>} visitor
   * @memberof BinaryNode
   */
  walk(visitor: TreeVisitor<ASTCCompilerNode>): void {
    const {test, consequent, alternate} = this;

    super.walk(visitor);

    if (test)
      visitor.visit(test);

    if (consequent)
      visitor.visit(consequent);

    if (alternate)
      visitor.visit(alternate);
  }
}
