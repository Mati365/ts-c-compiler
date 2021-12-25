import {isTreeNode, TreeNode} from './TreeNode';

export type TreeQuerySelector = (string | number)[];

export interface AbstractTreeVisitor<T extends TreeNode<any>> {
  visit(node: T): this;
}

/**
 * Iterates over tree
 *
 * @export
 * @class TreeVisitor
 * @template T
 */
export abstract class TreeVisitor<T extends TreeNode<any> = TreeNode> implements AbstractTreeVisitor<T> {
  protected history: T[] = [];

  get nesting() {
    return this.history.length;
  }

  /**
   * Begins iteration over tree
   *
   * @param {T} node
   * @returns {TreeVisitor<T>}
   * @memberof TreeVisitor
   */
  visit(node: T): this {
    if (!isTreeNode(node))
      return this;

    const {history} = this;

    history.push(node);

    try {
      const result = this.enter?.(node, history);
      if (result !== false)
        node.walk(this);

      this.leave?.(node, history); // eslint-disable-line no-unused-expressions
    } catch (e) {
      e.loc = e.loc ?? node.loc.start;

      throw e;
    }

    history.pop();

    return this;
  }

  enter?(node: T, history: T[]): void | boolean;
  leave?(node: T, history: T[]): void;
}
