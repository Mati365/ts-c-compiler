import {isTreeNode, TreeNode} from './TreeNode';

/**
 * Iterates over tree
 *
 * @export
 * @class TreeVisitor
 * @template T
 */
export abstract class TreeVisitor<T extends TreeNode<any>> {
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

/**
 * Default visitor that prints tree like HTML
 *
 * @export
 * @class TreePrintVisitor
 * @extends {TreeVisitor<T>}
 * @template T
 */
export class TreePrintVisitor<T extends TreeNode<any>> extends TreeVisitor<T> {
  private _reduced: string = '';

  get reduced() { return this._reduced; }

  enter(node: T) {
    const {nesting} = this;

    if (nesting === 1)
      this._reduced = '';

    this._reduced += `${''.padStart((this.nesting - 1) * 3, ' ')}<${node.toString()} />\n`;
  }

  /**
   * Converts node to string
   *
   * @static
   * @param {T} node
   * @returns {string}
   * @memberof TreePrintVisitor
   */
  static valueOf<T extends TreeNode<any>>(node: T): string {
    return (new TreePrintVisitor).visit(node).reduced;
  }
}
