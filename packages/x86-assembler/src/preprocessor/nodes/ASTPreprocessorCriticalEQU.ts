import * as R from 'ramda';

import { joinTokensWithSpaces } from '@ts-c/lexer';

import { Token } from '@ts-c/lexer';
import { NodeLocation } from '@ts-c/grammar';
import { TreeVisitor } from '@ts-c/grammar';

import { ASTPreprocessorKind, ASTPreprocessorNode } from '../constants';

import {
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/PreprocessorInterpreter';

/**
 * EQU values that are resolved before compilation
 */
export class ASTPreprocessorCriticalEQU extends ASTPreprocessorNode {
  private constant: boolean = null;

  constructor(
    loc: NodeLocation,
    readonly name: string,
    readonly expression: ASTPreprocessorNode,
    public originalTokens: Token[],
  ) {
    super(ASTPreprocessorKind.EquStmt, loc);
  }

  /**
   * If expressions is not constant - return original line
   */
  toEmitterLine(): string {
    const { constant, originalTokens } = this;

    if (constant) {
      return '';
    }

    return joinTokensWithSpaces(
      R.init(originalTokens), // exclude last EOL
    );
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
    const { name, expression } = this;

    try {
      if (interpreter.getCallables(name)?.length) {
        [, this.originalTokens] = interpreter.removeMacrosFromTokens(
          this.originalTokens,
        );
        return;
      }

      interpreter.setVariable(
        name,
        interpreter.evalExpression(expression),
        interpreter.isSecondPass(),
      );

      this.constant = true;
    } catch (e) {
      if (!interpreter.isSecondPass()) {
        interpreter.setVariable(name, null);
        interpreter.appendToSecondPassExec(this);
      } else {
        this.constant = false;
      }
    }
  }
}
