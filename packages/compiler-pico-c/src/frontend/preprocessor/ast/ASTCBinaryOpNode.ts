import { BinaryOpNode } from '@ts-c-compiler/grammar';
import { TokenType } from '@ts-c-compiler/lexer';

import type {
  CInterpreterContext,
  CPreprocessorInterpretable,
} from '../interpreter';

import {
  ASTCPreprocessorKind,
  type ASTCExecResult,
  type ASTCPreprocessorTreeNode,
} from './ASTCPreprocessorTreeNode';

/**
 * Transforms tree into for that second argument contains operator,
 * it is due to left recursion issue
 */
export class ASTPreprocessorBinaryOpNode
  extends BinaryOpNode<ASTCPreprocessorKind, ASTCPreprocessorTreeNode>
  implements CPreprocessorInterpretable
{
  constructor(
    op: TokenType,
    left: ASTCPreprocessorTreeNode,
    right: ASTCPreprocessorTreeNode,
    kind: ASTCPreprocessorKind = ASTCPreprocessorKind.BinaryOperator,
  ) {
    super(kind, op, left, right);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  exec(ctx: CInterpreterContext): ASTCExecResult {
    return null;
  }

  clone(): ASTPreprocessorBinaryOpNode {
    const { op, left, right, kind } = this;

    return new ASTPreprocessorBinaryOpNode(op, left, right, kind);
  }
}
