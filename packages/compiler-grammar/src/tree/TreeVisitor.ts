import {AbstractTreeVisitor} from './AbstractTreeVisitor';
import {isTreeNode, TreeNode} from './TreeNode';

/**
 * Iterates over tree
 *
 * @export
 * @class TreeVisitor
 * @template T
 */
export abstract class TreeVisitor<T extends TreeNode<any> = TreeNode> extends AbstractTreeVisitor<T> {
  /**
   * Begins iteration over tree
   *
   * @param {T} node
   * @returns {TreeVisitor<T>}
   * @memberof TreeVisitor
   */
  override visit(node: T): this {
    if (!isTreeNode(node))
      return this;

    return super.visit(node);
  }
}
