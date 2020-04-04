import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

import {
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/PreprocessorInterpreter';

import {
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from '../constants';

/**
 * @example
 *  %undef DUPA
 *
 * @export
 * @class ASTPreprocessorUndef
 * @extends {ASTPreprocessorNode}
 */
export class ASTPreprocessorUndef extends ASTPreprocessorNode {
  constructor(
    loc: NodeLocation,
    public readonly name: string,
  ) {
    super(ASTPreprocessorKind.UndefStmt, loc);
  }

  toString(): string {
    const {name} = this;

    return `${super.toString()} name="${name}"`;
  }

  /**
   * Exec interpreter on node
   *
   * @param {PreprocessorInterpreter} interpreter
   * @returns {InterpreterResult}
   * @memberof ASTPreprocessorMacro
   */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    interpreter.undefRuntimeCallable(this.name);
  }
}
