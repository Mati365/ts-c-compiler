import * as R from 'ramda';

import {removeNullValues} from '@compiler/core/utils';
import {walkOverFields} from '../decorators/walkOverFields';

import {NodeLocation} from './NodeLocation';
import {TreeVisitor} from './TreeVisitor';

export function isTreeNode(item: any): item is TreeNode<any> {
  return item && R.is(Object, item) && ('walk' in item);
}

/**
 * Node used to construct AST
 *
 * @export
 * @class TreeNode
 * @template K KindType
 * @template C TreeNode
 */
export class TreeNode<K = string, C extends TreeNode<K, C> = any> {
  constructor(
    public readonly kind: K,
    public readonly loc: NodeLocation,
    public children: C[] = null,
  ) {}

  /**
   * Create shallow copy of object
   *
   * @returns {TreeNode<K, C>}
   * @memberof TreeNode
   */
  clone(): TreeNode<K, C> {
    const {kind, loc, children} = this;

    return new TreeNode(kind, loc, children);
  }

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

  /**
   * Dumps provided attrs into string
   *
   * @static
   * @param {string} kind
   * @param {Record<string, any>} attrs
   * @return {string}
   * @memberof TreeNode
   */
  static dumpAttributesToString(kind: string, attrs: Record<string, any>): string {
    const serializedAttrs = R.pipe(
      removeNullValues,
      R.toPairs as any,
      R.map(([key, value]) => `${key}="${value}"`),
      R.join(' '),
    )(attrs);

    return `${kind} ${serializedAttrs}`.trim();
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
 * @template T
 */
@walkOverFields(
  {
    fields: [
      'left',
      'right',
    ],
  },
)
export class BinaryNode<K = string, T extends TreeNode<K> = TreeNode<K>> extends TreeNode<K> {
  constructor(
    kind: K,
    public left: T,
    public right: T,
  ) {
    super(kind, left?.loc);
  }

  /**
   * Clone of tree
   *
   * @returns {BinaryNode<K>}
   * @memberof BinaryNode
   */
  clone(): BinaryNode<K> {
    const {kind, left, right} = this;

    return new BinaryNode<K>(kind, left, right);
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
  getFirstNonNullSide(): T {
    const {left, right} = this;

    return left ?? right;
  }

  /**
   * Returns first non null side of tree if has only one side
   *
   * @returns {(T|this)}
   * @memberof BinaryNode
   */
  getSingleSideIfOnlyOne(): T|this {
    return (
      this.hasSingleSide()
        ? this.getFirstNonNullSide()
        : this
    );
  }
}
