import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

export class ASTCReturn extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly expression: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.Return, loc);
  }

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<ASTCCompilerNode>} visitor
   * @memberof ASTCReturn
   */
  walk(visitor: TreeVisitor<ASTCCompilerNode>): void {
    const {expression} = this;

    super.walk(visitor);

    if (expression)
      visitor.visit(expression);
  }
}
