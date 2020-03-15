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
    const {kind} = this;

    return (
      R.is(String, kind)
        ? <any> kind
        : null
    );
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

  toString(): string {
    const {value} = this;

    return `${super.toString()} value=${value}`;
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
    public left: TreeNode<K>,
    public right: TreeNode<K>,
  ) {
    super(kind, left?.loc);
  }

  /**
   * Returns true if only one side is present
   *
   * @returns {boolean}
   * @memberof BinaryNode
   */
  hasSingleSide(): boolean {
    const {left, right} = this;

    return !left !== !right;
  }

  /**
   * Returns non null first side from left
   *
   * @returns {TreeNode<K>}
   * @memberof BinaryNode
   */
  getFirstNonNullSide(): TreeNode<K> {
    const {left, right} = this;

    return left ?? right;
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
}
