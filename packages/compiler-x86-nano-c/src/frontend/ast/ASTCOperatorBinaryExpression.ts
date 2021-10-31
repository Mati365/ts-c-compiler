import {BinaryNode} from '@compiler/grammar/tree/TreeNode';
import {TokenType} from '@compiler/lexer/tokens';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

export {createBinOpIfBothSidesPresent} from '@compiler/grammar/utils';

/**
 * Stores tree node containing left or right tree node
 *
 * @export
 * @class ASTCOperatorBinaryExpression
 * @extends {BinaryNode}
 */
export class ASTCOperatorBinaryExpression extends BinaryNode<ASTCCompilerKind, ASTCCompilerNode> {
  constructor(
    public readonly op: TokenType,
    left: ASTCCompilerNode,
    right: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.BinaryOperatorExpression, left, right);
  }

  toString() {
    const {kind, op} = this;

    return ASTCCompilerNode.dumpAttributesToString(
      kind,
      {
        op,
      },
    );
  }
}
