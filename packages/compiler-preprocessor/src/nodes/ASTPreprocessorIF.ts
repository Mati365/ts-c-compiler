import {Token} from '@compiler/lexer/tokens';
import {TreeNode} from '@compiler/grammar/tree/TreeNode';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

/**
 * @example
 * %if 2 > 4
 *   mov ax, bx
 * %elif
 *   xor bx, bx
 * %endif
 *
 * @export
 * @class ASTPreprocessorIF
 * @extends {TreeNode}
 */
export class ASTPreprocessorIF extends TreeNode {
  constructor(
    loc: NodeLocation,
    public readonly logicExpression: Token[],
    children: TreeNode[],
  ) {
    super(loc, children);
  }
}
