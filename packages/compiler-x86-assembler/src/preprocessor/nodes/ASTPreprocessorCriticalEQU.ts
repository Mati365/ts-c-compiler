import * as R from 'ramda';

import {Token} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';

import {joinTokensWithSpaces} from '@compiler/lexer/utils/joinTokensTexts';

import {
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from '../constants';

import {
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/PreprocessorInterpreter';

/**
 * EQU values that are resolved before compilation
 *
 * @export
 * @class ASTPreprocessorCriticalEQU
 * @extends {ASTPreprocessorNode}
 */
export class ASTPreprocessorCriticalEQU extends ASTPreprocessorNode {
  private _constant: boolean = null;

  constructor(
    loc: NodeLocation,
    public readonly name: string,
    public readonly expression: ASTPreprocessorNode,
    public originalTokens: Token[],
  ) {
    super(ASTPreprocessorKind.EquStmt, loc);
  }

  /**
   * If expressions is not constant - return original line
   *
   * @returns {string}
   * @memberof ASTPreprocessorCriticalEQU
   */
  toEmitterLine(): string {
    const {_constant, originalTokens} = this;

    if (_constant)
      return '';

    return joinTokensWithSpaces(
      R.init(originalTokens), // exclude last EOL
    );
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
    const {name, expression} = this;

    try {
      if (interpreter.getCallables(name)?.length) {
        [, this.originalTokens] = interpreter.removeMacrosFromTokens(this.originalTokens);
        return;
      }

      interpreter.setVariable(
        name,
        interpreter.evalExpression(expression),
        interpreter.secondPassExec,
      );

      this._constant = true;
    } catch (e) {
      if (!interpreter.secondPassExec) {
        interpreter.setVariable(name, null);
        interpreter.appendToSecondPassExec(this);
      } else
        this._constant = false;
    }
  }
}
