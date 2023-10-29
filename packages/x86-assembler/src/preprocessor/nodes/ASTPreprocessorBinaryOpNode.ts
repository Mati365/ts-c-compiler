import { BinaryOpNode } from '@ts-c/grammar';
import { TokenType } from '@ts-c/lexer';
import { ASTPreprocessorNode, ASTPreprocessorKind } from '../constants';

import {
  PreprocessorInterpretable,
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/PreprocessorInterpreter';

export { createBinOpIfBothSidesPresent } from '@ts-c/grammar';

/**
 * Transforms tree into for that second argument contains operator,
 * it is due to left recursion issue
 */
export class ASTPreprocessorBinaryOpNode
  extends BinaryOpNode<ASTPreprocessorKind, ASTPreprocessorNode>
  implements PreprocessorInterpretable
{
  constructor(
    op: TokenType,
    left: ASTPreprocessorNode,
    right: ASTPreprocessorNode,
    kind: ASTPreprocessorKind = ASTPreprocessorKind.BinaryOperator,
  ) {
    super(kind, op, left, right);
  }

  clone(): ASTPreprocessorBinaryOpNode {
    const { op, left, right, kind } = this;

    return new ASTPreprocessorBinaryOpNode(op, left, right, kind);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */

  toEmitterLine(): string {
    return '';
  }
}
