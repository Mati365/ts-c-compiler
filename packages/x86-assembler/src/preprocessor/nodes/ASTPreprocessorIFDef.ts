import * as R from 'ramda';

import { NodeLocation } from '@ts-c/grammar';
import { TreeVisitor } from '@ts-c/grammar';

import { ASTPreprocessorKind, ASTPreprocessorNode } from '../constants';

import {
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/PreprocessorInterpreter';

import { ASTPreprocessorCondition } from './ASTPreprocessorIF';

/**
 * @example
 * %ifdef TEST
 *   mov ax, bx
 * %elif
 *   xor bx, bx
 * %endif
 */
export class ASTPreprocessorIFDef extends ASTPreprocessorCondition {
  constructor(
    loc: NodeLocation,
    negated: boolean,
    readonly itemName: string,
    consequent: ASTPreprocessorNode,
    alternate: ASTPreprocessorNode = null,
  ) {
    super(ASTPreprocessorKind.IfDefStmt, loc, negated, consequent, alternate);
  }

  /**
   * Exec interpreter on node
   */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    const { consequent, alternate, itemName, negated } = this;
    let result =
      !R.isNil(interpreter.getVariable(itemName)) ||
      interpreter.getCallables(itemName)?.length > 0;
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
    const { consequent, alternate } = this;

    super.walk(visitor);

    if (consequent) {
      visitor.visit(consequent);
    }

    if (alternate) {
      visitor.visit(alternate);
    }
  }
}
