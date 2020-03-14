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
