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

  /* eslint-disable class-methods-use-this */
  toString(): string {
    return null;
  }
  /* eslint-enable class-methods-use-this */
}
