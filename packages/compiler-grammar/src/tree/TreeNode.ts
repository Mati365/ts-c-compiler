import * as R from 'ramda';
import {NodeLocation} from './NodeLocation';
import {TreeVisitor} from './TreeVisitor';

/**
 * Node used to construct AST
 *
 * @export
 * @class TreeNode
 * @template K KindType
 */
export class TreeNode<K = string> {
  constructor(
    public readonly kind: K,
    public readonly loc: NodeLocation,
    public children: TreeNode<K>[] = null,
  ) {}

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<TreeNode<K>>} visitor
   * @memberof TreeNode
   */
  walk(visitor: TreeVisitor<TreeNode<K>>): void {
    const {children} = this;

    if (children) {
      R.forEach(
        (child) => {
          visitor.visit(child);
        },
        children,
      );
    }
  }

  /**
   * Used in grammars parser to exclude empty e.g. lines
   *
   * @returns {boolean}
   * @memberof TreeNode
   */
  isEmpty(): boolean {
    return false;
  }

  toString(): string {
    return null;
  }
}

/**
 * Node withs ingle value
 *
 * @export
 * @class ValueNode
 * @extends {TreeNode<KindType>}
 * @template T
 * @template K
 */
export class ValueNode<T, K = string> extends TreeNode<K> {
  constructor(
    kind: K,
    loc: NodeLocation,
    public readonly value: T,

  ) {
    super(kind, loc, null);
  }
}

/**
 * Node that has other node on left or right
 *
 * @export
 * @class BinaryNode
 * @extends {TreeNode<K>}
 * @template K
 */
export class BinaryNode<K = string> extends TreeNode<K> {
  constructor(
    kind: K,
    public readonly left: TreeNode<K>,
    public readonly right: TreeNode<K>,
  ) {
    super(kind, left?.loc);
  }

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<TreeNode<K>>} visitor
   * @memberof BinaryNode
   */
  walk(visitor: TreeVisitor<TreeNode<K>>): void {
    const {left, right} = this;

    if (left)
      visitor.visit(left);

    if (right)
      visitor.visit(right);
  }

  /**
   * Creates node that if any of left or right
   * is null beacames single TreeNode
   *
   * @static
   * @template KindType
   * @param {K} kind
   * @param {TreeNode<K>} left
   * @param {TreeNode<K>} right
   * @returns {(TreeNode<K> | BinaryNode<K>)}
   * @memberof BinaryNode
   */
  static createOptionalBinary<K>(
    kind: K,
    left: TreeNode<K>,
    right: TreeNode<K>,
  ): TreeNode<K> | BinaryNode<K> {
    if (left && right)
      return new BinaryNode<K>(kind, left, right);

    if (!left)
      return right;

    return left;
  }
}
