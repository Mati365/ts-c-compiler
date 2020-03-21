import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';

import {
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/PreprocessorInterpreter';

import {
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from '../constants';

export class ASTPreprocessorDefineArgSchema {
  constructor(
    public readonly name: string,
  ) {}
}

export type ASTPreprocessorRuntimeArg = string|number;

export interface ASTPreprocessorCallable {
  readonly name: string;

  runtimeCall(args: ASTPreprocessorRuntimeArg[]): string;
}

/**
 * @example
 *  %define param(a, b) ((a)+(b)*4)
 *
 * @export
 * @class ASTPreprocessorDefine
 * @extends {ASTPreprocessorNode}
 */
export class ASTPreprocessorDefine extends ASTPreprocessorNode implements ASTPreprocessorCallable {
  constructor(
    loc: NodeLocation,
    public readonly name: string,
    public readonly argsSchema: ASTPreprocessorDefineArgSchema[] = [],
    public readonly expression: Token[],
  ) {
    super(ASTPreprocessorKind.DefineStmt, loc);
  }

  toString(): string {
    const {name, argsSchema} = this;

    return `${super.toString()} name=${name} args=${argsSchema.length}`;
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
   * @param {ASTPreprocessorRuntimeArg[]} args
   * @returns {string}
   * @memberof ASTPreprocessorDefine
   */
  runtimeCall(args: ASTPreprocessorRuntimeArg[]): string {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
