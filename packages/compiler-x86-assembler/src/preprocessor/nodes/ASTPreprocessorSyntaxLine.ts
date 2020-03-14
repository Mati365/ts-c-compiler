import {Token} from '@compiler/lexer/tokens';
import {TreeNode} from '@compiler/grammar/tree/TreeNode';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

/**
 * Other lines
 *
 * @export
 * @class ASTPreprocessorSyntaxLine
 * @extends {TreeNode}
 */
export class ASTPreprocessorSyntaxLine extends TreeNode {
  constructor(
    loc: NodeLocation,
    public readonly tokens: Token[],
  ) {
    super(loc);
  }

  isEmpty(): boolean {
    return !this.tokens.length;
  }
}
