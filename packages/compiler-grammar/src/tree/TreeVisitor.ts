import {TreeNode} from './TreeNode';

/**
 * Iterates over tree
 *
 * @export
 * @class TreeVisitor
 * @template T
 */
export abstract class TreeVisitor<T extends TreeNode<any>> {
  protected nesting = 0;

  /**
   * Begins iteration over tree
   *
   * @param {T} node
   * @returns {TreeVisitor<T>}
   * @memberof TreeVisitor
   */
  visit(node: T): this {
    this.nesting++;
    this.enter?.(node); // eslint-disable-line no-unused-expressions

    node.walk(this);

    this.leave?.(node); // eslint-disable-line no-unused-expressions
    this.nesting--;

    return this;
  }

  enter?(node: T): void;
  leave?(node: T): void;
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
}
