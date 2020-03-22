import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from '../constants';

/**
 * @example
 *  expr1 && expr2 && expr3 > expr2
 *
 * @export
 * @class ASTPreprocessorExpression
 * @extends {ASTPreprocessorNode}
 */
export class ASTPreprocessorExpression extends ASTPreprocessorNode {
  constructor(
    loc: NodeLocation,
    public expression: ASTPreprocessorNode,
  ) {
    super(ASTPreprocessorKind.LogicExpression, loc);
  }

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<ASTPreprocessorNode>} visitor
   * @memberof TreeNode
   */
  walk(visitor: TreeVisitor<ASTPreprocessorNode>): void {
    const {expression} = this;

    if (expression)
      visitor.visit(expression);
  }
}
