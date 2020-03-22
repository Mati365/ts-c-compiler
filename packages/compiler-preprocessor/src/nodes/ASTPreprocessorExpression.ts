import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from '../constants';

import {
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/PreprocessorInterpreter';

/**
 * @example
 *  expr1 && expr2 && expr3 > expr2
 *
 * @export
 * @class ASTPreprocessorExpression
 * @extends {ASTPreprocessorNode}
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
   *
   * @param {TreeVisitor<ASTPreprocessorNode>} visitor
   * @memberof TreeNode
   */
  walk(visitor: TreeVisitor<ASTPreprocessorNode>): void {
    const {expression} = this;

    if (expression)
      visitor.visit(expression);
  }

  /**
   * Exec interpreter on node
   *
   * @param {PreprocessorInterpreter} interpreter
   * @returns {InterpreterResult}
   * @memberof ASTPreprocessorMacro
   */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    const {expression} = this;

    return interpreter.evalExpression(expression);
  }
}
