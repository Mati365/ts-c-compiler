import { NodeLocation } from '@ts-c-compiler/grammar';
import { TreeVisitor } from '@ts-c-compiler/grammar';
import { ASTPreprocessorKind, ASTPreprocessorNode } from '../constants';

import {
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/PreprocessorInterpreter';

/**
 * @example
 *  expr1 && expr2 && expr3 > expr2
 */
export class ASTPreprocessorExpression extends ASTPreprocessorNode {
  constructor(
    loc: NodeLocation,
    public expression: ASTPreprocessorNode,
  ) {
    super(ASTPreprocessorKind.LogicExpression, loc);
  }

  /**
   * Iterates throught tree
   */
  walk(visitor: TreeVisitor<ASTPreprocessorNode>): void {
    const { expression } = this;

    if (expression) {
      visitor.visit(expression);
    }
  }

  /**
   * Exec interpreter on node
   */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    const { expression } = this;

    return interpreter.evalExpression(expression);
  }
}
