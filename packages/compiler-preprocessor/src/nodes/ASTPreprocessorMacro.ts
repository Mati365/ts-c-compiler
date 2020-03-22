import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

import {ASTPreprocessorCallable} from './ASTPreprocessorDefine';
import {ASTPreprocessorStmt} from './ASTPreprocessorStmt';
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
 * %macro dupa 1
 *  xor eax, eax
 * %endmacro
 *
 * @export
 * @class ASTPreprocessorMacro
 * @extends {ASTPreprocessorNode}
 */
export class ASTPreprocessorMacro extends ASTPreprocessorNode implements ASTPreprocessorCallable {
  constructor(
    loc: NodeLocation,
    public readonly name: string,
    public readonly argsCount: number,
    public readonly content: ASTPreprocessorStmt,
  ) {
    super(ASTPreprocessorKind.MacroStmt, loc);
  }

  toString(): string {
    const {name, argsCount} = this;

    return `${super.toString()} name="${name}" args=${argsCount}`;
  }

  /**
   * Exec interpreter on node
   *
   * @param {PreprocessorInterpreter} interpreter
   * @returns {InterpreterResult}
   * @memberof ASTPreprocessorMacro
   */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    interpreter.defineRuntimeCallable(this);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  /**
   * Allow to call ASTNode as callable functions
   *
   * @param {string[]} args
   * @returns {string}
   * @memberof ASTPreprocessorDefine
   */
  runtimeCall(args: string[]): string {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<ASTPreprocessorNode>} visitor
   * @memberof BinaryNode
   */
  walk(visitor: TreeVisitor<ASTPreprocessorNode>): void {
    const {content} = this;

    if (content)
      visitor.visit(content);
  }
}
