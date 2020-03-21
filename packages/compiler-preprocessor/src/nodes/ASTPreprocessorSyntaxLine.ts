import * as R from 'ramda';

import {Token, TokenType} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TokensIterator} from '@compiler/grammar/tree/TokensIterator';

import {
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/PreprocessorInterpreter';

import {
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from '../constants';

import {fetchRuntimeCallArgsList} from '../interpreter/utils/fetchRuntimeCallArgsList';

/**
 * Sucky asm tokens join
 *
 * @param {Token[]} tokens
 * @returns {string}
 */
function formatAsmStmt(tokens: Token[]): string {
  return R.reduce(
    (acc, token) => {
      const lastChar = R.last(acc);

      if (acc
          && (token.type === TokenType.KEYWORD || token.text === '[')
          && token.text !== ':'
          && lastChar !== ' '
          && lastChar !== ':'
          && lastChar !== '[')
        acc += ' ';

      acc += token.text;
      return acc;
    },
    '',
    tokens,
  );
}

/**
 * Other lines
 *
 * @export
 * @class ASTPreprocessorSyntaxLine
 * @extends {ASTPreprocessorNode}
 */
export class ASTPreprocessorSyntaxLine extends ASTPreprocessorNode {
  constructor(
    loc: NodeLocation,
    public readonly tokens: Token[],
  ) {
    super(ASTPreprocessorKind.SyntaxStmt, loc);
  }

  isEmpty(): boolean {
    return !this.tokens.length;
  }

  toString(): string {
    const {kind, tokens} = this;

    return `${kind} stmt="${formatAsmStmt(tokens)}"`;
  }

  /**
   * Exec interpreter on node
   *
   * @param {PreprocessorInterpreter} interpreter
   * @returns {InterpreterResult}
   * @memberof ASTPreprocessorMacro
   */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    const {tokens} = this;

    for (let i = 0; i < tokens.length; ++i) {
      const token = tokens[i];
      if (token.type !== TokenType.KEYWORD || !interpreter.isCallable(token.text))
        continue;

      console.info(
        fetchRuntimeCallArgsList(
          new TokensIterator(tokens, i + 1),
        ),
      );
    }
  }
}
