import { AbstractTreeVisitor } from './AbstractTreeVisitor';
import { isTreeNode, TreeNode } from './TreeNode';

/**
 * Iterates over tree
 */
export abstract class TreeVisitor<
  T extends TreeNode<any> = TreeNode,
> extends AbstractTreeVisitor<T> {
  /**
   * Begins iteration over tree
   */
  override visit(node: T): this {
    if (!isTreeNode(node)) {
      return this;
    }

    return super.visit(node);
  }
}
