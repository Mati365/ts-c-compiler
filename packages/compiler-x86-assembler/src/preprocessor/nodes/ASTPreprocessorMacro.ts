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
    readonly name: string,
    readonly caseSensitive: boolean,
    readonly argsCount: number,
    readonly content: ASTPreprocessorStmt,
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

  /**
   * Allow to call ASTNode as callable functions
   *
   * @param {PreprocessorInterpreter} interpreter
   * @param {string[]} args
   * @returns {string}
   * @memberof ASTPreprocessorMacro
   */
  runtimeCall(interpreter: PreprocessorInterpreter, args: string[]): string {
    // creates $0, $1, $2 variables
    const variables: [string, InterpreterResult][] = args.map(
      (arg, index) => ([`%${index + 1}`, arg]),
    );

    // produces inner macro content
    return interpreter.enterScope(
      variables,
      () => interpreter.execTree(this.content),
    );
  }

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<ASTPreprocessorNode>} visitor
   * @memberof ASTPreprocessorMacro
   */
  walk(visitor: TreeVisitor<ASTPreprocessorNode>): void {
    const {content} = this;

    if (content)
      visitor.visit(content);
  }
}
