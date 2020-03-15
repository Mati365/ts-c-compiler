import {Token} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from '../constants';

/**
 * Other lines
 *
 * @export
 * @class ASTPreprocessorSyntaxLine
 * @extends {ASTPreprocessorNode}
 */
export class ASTPreprocessorSyntaxLine extends ASTPreprocessorNode {
  constructor(
    loc: NodeLocation,
    public readonly tokens: Token[],
  ) {
    super(ASTPreprocessorKind.SyntaxStmt, loc);
  }

  isEmpty(): boolean {
    return !this.tokens.length;
  }
}
