import {TreeNode} from '@compiler/grammar/tree/TreeNode';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

/**
 * @example
 * %macro dupa 1
 *  xor eax, eax
 * %endmacro
 *
 * @export
 * @class ASTPreprocessorMacro
 * @extends {TreeNode}
 */
export class ASTPreprocessorMacro extends TreeNode {
  constructor(
    loc: NodeLocation,
    public readonly name: string,
    public readonly argsCount: number,
    children: TreeNode[],
  ) {
    super(loc, children);
  }
}
