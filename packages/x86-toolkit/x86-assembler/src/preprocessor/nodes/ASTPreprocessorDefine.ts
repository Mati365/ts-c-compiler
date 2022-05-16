import * as R from 'ramda';

import {joinTokensWithSpaces} from '@compiler/lexer/utils/joinTokensTexts';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token, TokenType} from '@compiler/lexer/tokens';

import {
  PreprocessorError,
  PreprocessorErrorCode,
} from '../PreprocessorError';

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
    readonly name: string,
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
    readonly name: string,
    readonly caseSensitive: boolean,
    readonly argsSchema: ASTPreprocessorDefineArgSchema[] = [],
    readonly expression?: Token[],
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
      throw new PreprocessorError(
        PreprocessorErrorCode.MACRO_ARGS_LIST_MISMATCH,
        null,
        {
          expected: argsSchema.length,
          provided: args.length,
          name,
        },
      );
    }

    const mappedTokens: Token[] = [...expression];
    for (let i = 0; i < mappedTokens.length; ++i) {
      const token = mappedTokens[i];
      if (token.type !== TokenType.KEYWORD)
        continue;

      const schemaIndex = R.findIndex(
        (schema) => token.text === schema.name,
        argsSchema,
      );

      if (schemaIndex === -1)
        continue;

      const newToken = new Token(TokenType.KEYWORD, null, args[schemaIndex], token.loc);
      const resize = mappedTokens[i].text.length - newToken.text.length;

      // prevent something like it:
      // %define section(section_name) [section section_name]
      // section(a) it will produce some space after section [section a    ]
      // because section_name length is bigger than a and ] location column stays the same
      for (let j = i + 1; j < mappedTokens.length; ++j) {
        if (mappedTokens[j].loc.row !== newToken.loc.row)
          break;

        mappedTokens[j].loc.column -= resize;
      }

      mappedTokens[i] = newToken;
    }

    return joinTokensWithSpaces(
      interpreter.removeMacrosFromTokens(mappedTokens)[1],
      true,
    );
  }
}
