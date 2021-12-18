import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';

import {
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from '../constants';

import {ASTPreprocessorExpression} from './ASTPreprocessorExpression';
import {
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/PreprocessorInterpreter';

export class ASTPreprocessorCondition extends ASTPreprocessorNode {
  protected result: boolean = false;

  constructor(
    kind: ASTPreprocessorKind,
    loc: NodeLocation,
    public readonly negated: boolean,
    public readonly consequent: ASTPreprocessorNode,
    public readonly alternate: ASTPreprocessorNode = null,
  ) {
    super(kind, loc);
  }

  toEmitterLine(interpreter: PreprocessorInterpreter): string {
    const {result, consequent, alternate} = this;

    if (result)
      return consequent.toEmitterLine(interpreter);

    return alternate?.toEmitterLine(interpreter) ?? '';
  }
}

/**
 * @example
 * %if 2 > 4
 *   mov ax, bx
 * %elif
 *   xor bx, bx
 * %endif
 *
 * @export
 * @class ASTPreprocessorIF
 * @extends {ASTPreprocessorCondition}
 */
export class ASTPreprocessorIF extends ASTPreprocessorCondition {
  constructor(
    loc: NodeLocation,
    negated: boolean,
    public readonly test: ASTPreprocessorExpression,
    consequent: ASTPreprocessorNode,
    alternate: ASTPreprocessorNode = null,
  ) {
    super(ASTPreprocessorKind.IfStmt, loc, negated, consequent, alternate);
  }

  /**
   * Exec interpreter on node
   *
   * @param {PreprocessorInterpreter} interpreter
   * @returns {InterpreterResult}
   * @memberof ASTPreprocessorMacro
   */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    const {test, consequent, alternate, negated} = this;
    let result = <boolean> test.exec(interpreter);
    if (negated)
      result = !result;

    this.result = result;
    if (result)
      return consequent.exec(interpreter);

    return alternate?.exec(interpreter);
  }

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<ASTPreprocessorNode>} visitor
   * @memberof ASTPreprocessorIF
   */
  walk(visitor: TreeVisitor<ASTPreprocessorNode>): void {
    const {test, consequent, alternate} = this;

    super.walk(visitor);

    if (test)
      visitor.visit(test);

    if (consequent)
      visitor.visit(consequent);

    if (alternate)
      visitor.visit(alternate);
  }
}
