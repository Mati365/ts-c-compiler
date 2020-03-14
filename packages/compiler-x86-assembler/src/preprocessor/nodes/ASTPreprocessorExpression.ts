import {TreeNode} from '@compiler/grammar/tree/TreeNode';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';

/**
 * @example
 *  %[((a)+(b)*4)],
 *    -----------
 *  content only
 *
 * @export
 * @class ASTPreprocessorDefine
 * @extends {TreeNode}
 */
export class ASTPreprocessorExpression extends TreeNode {
  constructor(
    loc: NodeLocation,
    public readonly evaluate: boolean,
    public readonly expression: Token[],
  ) {
    super(loc);
  }
}
