import { BinaryOpNode } from '@ts-c/grammar';
import { TokenType } from '@ts-c/lexer';
import { CType } from '../../analyze/types/CType';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export { createBinOpIfBothSidesPresent } from '@ts-c/grammar';

export function isASTCBinaryOpNode(
  node: ASTCCompilerNode,
): node is ASTCBinaryOpNode {
  return node.kind === ASTCCompilerKind.BinaryOperator;
}

/**
 * Stores tree node containing left or right tree node
 */
export class ASTCBinaryOpNode extends BinaryOpNode<
  ASTCCompilerKind,
  ASTCCompilerNode
> {
  type?: CType;

  constructor(op: TokenType, left: ASTCCompilerNode, right: ASTCCompilerNode) {
    super(ASTCCompilerKind.BinaryOperator, op, left, right);
  }
}
