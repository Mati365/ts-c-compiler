import {BinaryNode} from '@compiler/grammar/tree/TreeNode';
import {TokenType} from '@compiler/lexer/tokens';
import {
  ASTPreprocessorNode,
  ASTPreprocessorKind,
} from '../constants';

import {
  Interpretable,
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/Interpreter';

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
export class ASTPreprocessorBinaryOpNode extends BinaryNode<ASTPreprocessorKind> implements Interpretable {
  constructor(
    public op: TokenType,
    left: ASTPreprocessorNode,
    right: ASTPreprocessorNode,
    kind: ASTPreprocessorKind = ASTPreprocessorKind.BinaryOperator,
  ) {
    super(kind, left, right);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */

  toString(): string {
    const {op} = this;

    return `${super.toString()} op=${op}`;
  }
}
