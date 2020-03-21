import {BinaryNode} from '@compiler/grammar/tree/TreeNode';
import {TokenType} from '@compiler/lexer/tokens';
import {
  ASTPreprocessorNode,
  ASTPreprocessorKind,
} from '../constants';

export function createBinOpIfBothSidesPresent<T extends ASTPreprocessorBinaryOpNode>(
  ClassType: new(op: TokenType, left: ASTPreprocessorNode, right: ASTPreprocessorNode) => T,
  op: TokenType,
  left: ASTPreprocessorNode,
  right: ASTPreprocessorNode,
): T | ASTPreprocessorNode {
  if (left && right)
    return new ClassType(op, left, right);

  if (!left)
    return right;

  return left;
}

/**
 * Transforms tree into for that second argument contains operator,
 * it is due to left recursion issue
 *
 * @class ASTPreprocessorBinaryOpNode
 * @extends {BinaryNode<ASTPreprocessorKind>}
 */
export class ASTPreprocessorBinaryOpNode extends BinaryNode<ASTPreprocessorKind> {
  constructor(
    public op: TokenType,
    left: ASTPreprocessorNode,
    right: ASTPreprocessorNode,
    kind: ASTPreprocessorKind = ASTPreprocessorKind.BinaryOperator,
  ) {
    super(kind, left, right);
  }

  toString(): string {
    const {op} = this;

    return `${super.toString()} op=${op}`;
  }
}
