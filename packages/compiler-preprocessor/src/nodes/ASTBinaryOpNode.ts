import {BinaryNode} from '@compiler/grammar/tree/TreeNode';
import {TokenType, LogicTokenType} from '@compiler/lexer/tokens';
import {
  ASTPreprocessorNode,
  ASTPreprocessorKind,
} from '../constants';

export function createBinOpIfBothSidesPresent<T extends ASTBinaryOpNode>(
  ClassType: new(op: TokenType, left: ASTPreprocessorNode, right: ASTPreprocessorNode) => T,
  op: TokenType,
  left: ASTPreprocessorNode,
  right: ASTPreprocessorNode,
): ASTBinaryOpNode | ASTPreprocessorNode {
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
 * @class ASTOperatorNode
 * @extends {BinaryNode<ASTPreprocessorKind>}
 */
export class ASTBinaryOpNode extends BinaryNode<ASTPreprocessorKind> {
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

/**
 * Handles && or ||
 *
 * @export
 * @class ASTBinaryLogicOpNode
 * @extends {ASTBinaryOpNode}
 */
export class ASTBinaryLogicOpNode extends ASTBinaryOpNode {
  constructor(
    public op: LogicTokenType,
    left: ASTPreprocessorNode,
    right: ASTPreprocessorNode,
  ) {
    super(
      op,
      left,
      right,
      ASTPreprocessorKind.BinaryLogicOperator,
    );
  }
}
