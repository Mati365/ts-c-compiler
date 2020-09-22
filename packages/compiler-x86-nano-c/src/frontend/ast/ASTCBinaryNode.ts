import {BinaryNode} from '@compiler/grammar/tree/TreeNode';
import {TokenType} from '@compiler/lexer/tokens';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

export function createBinOpIfBothSidesPresent<T extends ASTCBinaryOpNode>(
  ClassType: new(op: TokenType, left: ASTCCompilerNode, right: ASTCCompilerNode) => T,
  op: TokenType,
  left: ASTCCompilerNode,
  right: ASTCCompilerNode,
): T | ASTCCompilerNode {
  if (left && right)
    return new ClassType(op, left, right);

  if (!left)
    return right;

  return left;
}

/**
 * Binary node with two operators
 *
 * @export
 * @class ASTCBinaryOpNode
 * @extends {BinaryNode<ASTCCompilerKind, ASTCCompilerNode>}
 */
export class ASTCBinaryOpNode extends BinaryNode<ASTCCompilerKind, ASTCCompilerNode> {
  constructor(
    public op: TokenType,
    left: ASTCCompilerNode,
    right: ASTCCompilerNode,
    kind: ASTCCompilerKind = ASTCCompilerKind.BinaryOperator,
  ) {
    super(kind, left, right);
  }

  clone(): ASTCBinaryOpNode {
    const {op, left, right, kind} = this;

    return new ASTCBinaryOpNode(op, left, right, kind);
  }

  toString(): string {
    const {op} = this;

    return `${super.toString()} op=${op}`;
  }
}
