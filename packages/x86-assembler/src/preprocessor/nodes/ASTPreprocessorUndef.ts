import { NodeLocation } from '@ts-c-compiler/grammar';
import {
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/PreprocessorInterpreter';

import { ASTPreprocessorKind, ASTPreprocessorNode } from '../constants';

/**
 * @example
 *  %undef DUPA
 */
export class ASTPreprocessorUndef extends ASTPreprocessorNode {
  constructor(
    loc: NodeLocation,
    readonly name: string,
  ) {
    super(ASTPreprocessorKind.UndefStmt, loc);
  }

  toString(): string {
    const { name } = this;

    return `${super.toString()} name="${name}"`;
  }

  /**
   * Exec interpreter on node
   */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    interpreter.undefRuntimeCallable(this.name);
  }
}
