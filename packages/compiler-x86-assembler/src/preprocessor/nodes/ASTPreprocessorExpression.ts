import {TreeNode} from '@compiler/grammar/tree/TreeNode';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TokenType} from '@compiler/lexer/tokens';

/**
 *
 *
 * @export
 * @class ASTPreprocessorLogicalExpression
 * @extends {TreeNode}
 */
export class ASTPreprocessorLogicalExpression extends TreeNode {
  constructor(
    loc: NodeLocation,
    public operator: TokenType,
  ) {
    super(loc);
  }
}
