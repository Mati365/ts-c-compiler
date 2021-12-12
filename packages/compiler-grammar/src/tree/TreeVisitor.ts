import {isTreeNode, TreeNode} from './TreeNode';

/**
 * Iterates over tree
 *
 * @export
 * @class TreeVisitor
 * @template T
 */
export abstract class TreeVisitor<T extends TreeNode<any> = TreeNode> {
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
    this.enter?.(node, history); // eslint-disable-line no-unused-expressions

    node.walk(this);

    this.leave?.(node, history); // eslint-disable-line no-unused-expressions
    history.pop();

    return this;
  }

  enter?(node: T, history: T[]): void;
  leave?(node: T, history: T[]): void;
}
