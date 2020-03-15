import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';

import {
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from '../constants';

/**
 * @example
 * %if 2 > 4
 *   mov ax, bx
 * %elif
 *   xor bx, bx
 * %endif
 *
 * @export
 * @class ASTPreprocessorIF
 * @extends {ASTPreprocessorNode}
 */
export class ASTPreprocessorIF extends ASTPreprocessorNode {
  constructor(
    loc: NodeLocation,
    public readonly logicExpression: ASTPreprocessorNode,
    children: ASTPreprocessorNode[],
  ) {
    super(ASTPreprocessorKind.IfStmt, loc, children);
  }

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<ASTPreprocessorNode>} visitor
   * @memberof BinaryNode
   */
  walk(visitor: TreeVisitor<ASTPreprocessorNode>): void {
    const {logicExpression} = this;

    super.walk(visitor);

    if (logicExpression)
      visitor.visit(logicExpression);
  }
}
