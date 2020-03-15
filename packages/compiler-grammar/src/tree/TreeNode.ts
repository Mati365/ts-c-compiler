import {NodeLocation} from './NodeLocation';

/**
 * Node used to construct AST
 *
 * @export
 * @class TreeNode
 */
export class TreeNode {
  constructor(
    public readonly loc: NodeLocation,
    public children: TreeNode[] = null,
  ) {}

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
 * Node with single value
 *
 * @export
 * @class ValueNode
 * @extends {TreeNode}
 * @template T
 */
export class ValueNode<T> extends TreeNode {
  constructor(
    public readonly value: T,
    loc: NodeLocation,
  ) {
    super(loc);
  }
}

/**
 * Node that has other node on left or right
 *
 * @export
 * @class BinaryNode
 * @extends {TreeNode}
 */
export class BinaryNode extends TreeNode {
  constructor(
    public readonly left: TreeNode,
    public readonly right: TreeNode,
  ) {
    super(left?.loc);
  }

  /**
   * Creates node that if any of left or right
   * is null beacames single TreeNode
   *
   * @static
   * @param {TreeNode} left
   * @param {TreeNode} right
   * @returns {(TreeNode|BinaryNode)}
   * @memberof BinaryNode
   */
  static createOptionalBinary(left: TreeNode, right: TreeNode): TreeNode|BinaryNode {
    if (left && right)
      return new BinaryNode(left, right);

    if (!left)
      return right;

    return left;
  }
}
