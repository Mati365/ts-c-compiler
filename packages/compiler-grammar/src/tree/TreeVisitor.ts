import {TreeNode} from './TreeNode';

/**
 * Iterates over tree
 *
 * @export
 * @class TreeVisitor
 * @template T
 */
export class TreeVisitor<T extends TreeNode<any>> {
  nesting = 0;

  visit(node: T): void {
    this.nesting++;
    this.enter?.(node); // eslint-disable-line no-unused-expressions

    node.walk(this);

    this.leave?.(node); // eslint-disable-line no-unused-expressions
    this.nesting--;
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
  enter(node: T) {
    console.info(''.padStart(this.nesting * 4, ' '), `<${node.kind} />`);
  }
}
