import * as R from 'ramda';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token, TokenType} from '@compiler/lexer/tokens';
import {
  GrammarError,
  GrammarErrorCode,
} from '@compiler/grammar/GrammarError';

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

export interface ASTPreprocessorCallable {
  readonly name: string;
  readonly argsCount: number;
  readonly caseSensitive: boolean;

  runtimeCall(interpreter: PreprocessorInterpreter, args: string[]): string;
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
    public readonly caseSensitive: boolean,
    public readonly argsSchema: ASTPreprocessorDefineArgSchema[] = [],
    public readonly expression: Token[],
  ) {
    super(ASTPreprocessorKind.DefineStmt, loc);
  }

  get argsCount(): number {
    return this.argsSchema.length;
  }

  toString(): string {
    const {name, argsSchema} = this;

    return `${super.toString()} name="${name}" args=${argsSchema.length}`;
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
   * @memberof ASTPreprocessorDefine
   */
  runtimeCall(interpreter: PreprocessorInterpreter, args: string[]): string {
    const {name, argsSchema, expression} = this;
    if (args.length !== argsSchema.length) {
      throw new GrammarError(
        GrammarErrorCode.MACRO_ARGS_LIST_MISMATCH,
        null,
        {
          expected: argsSchema.length,
          provided: args.length,
          name,
        },
      );
    }

    const mappedTokens = R.map(
      (token) => {
        if (token.type !== TokenType.KEYWORD)
          return token;

        const schemaIndex = R.findIndex(
          (schema) => token.text === schema.name,
          argsSchema,
        );
        if (schemaIndex === -1)
          return token;

        return new Token(
          TokenType.KEYWORD,
          null,
          args[schemaIndex],
          token.loc,
        );
      },
      expression,
    );

    return interpreter.removeMacrosFromTokens(mappedTokens)[1].join(' ');
  }
}
