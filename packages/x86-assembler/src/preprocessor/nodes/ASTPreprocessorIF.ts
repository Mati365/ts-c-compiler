import { NodeLocation } from '@ts-c-compiler/grammar';
import { TreeVisitor } from '@ts-c-compiler/grammar';

import { ASTPreprocessorKind, ASTPreprocessorNode } from '../constants';

import { ASTPreprocessorExpression } from './ASTPreprocessorExpression';
import {
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/PreprocessorInterpreter';

export class ASTPreprocessorCondition extends ASTPreprocessorNode {
  protected result: boolean = false;

  constructor(
    kind: ASTPreprocessorKind,
    loc: NodeLocation,
    readonly negated: boolean,
    readonly consequent: ASTPreprocessorNode,
    readonly alternate: ASTPreprocessorNode = null,
  ) {
    super(kind, loc);
  }

  toEmitterLine(interpreter: PreprocessorInterpreter): string {
    const { result, consequent, alternate } = this;

    if (result) {
      return consequent.toEmitterLine(interpreter);
    }

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
 */
export class ASTPreprocessorIF extends ASTPreprocessorCondition {
  constructor(
    loc: NodeLocation,
    negated: boolean,
    readonly test: ASTPreprocessorExpression,
    consequent: ASTPreprocessorNode,
    alternate: ASTPreprocessorNode = null,
  ) {
    super(ASTPreprocessorKind.IfStmt, loc, negated, consequent, alternate);
  }

  /**
   * Exec interpreter on node
   */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    const { test, consequent, alternate, negated } = this;
    let result = <boolean>test.exec(interpreter);
    if (negated) {
      result = !result;
    }

    this.result = result;
    if (result) {
      return consequent.exec(interpreter);
    }

    return alternate?.exec(interpreter);
  }

  /**
   * Iterates throught tree
   */
  walk(visitor: TreeVisitor<ASTPreprocessorNode>): void {
    const { test, consequent, alternate } = this;

    super.walk(visitor);

    if (test) {
      visitor.visit(test);
    }

    if (consequent) {
      visitor.visit(consequent);
    }

    if (alternate) {
      visitor.visit(alternate);
    }
  }
}
