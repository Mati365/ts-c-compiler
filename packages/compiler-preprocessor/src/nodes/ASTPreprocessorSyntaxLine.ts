import * as R from 'ramda';

import {Token} from '@compiler/lexer/tokens';
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
 * Sucky asm tokens join
 *
 * @param {Token[]} tokens
 * @returns {string}
 */
function formatAsmStmt(tokens: Token[]): string {
  let line = '';
  let cursor = 0;

  for (let i = 0; i < tokens.length; ++i) {
    const token = tokens[i];
    const tokenStr = token.toString();
    if (R.isNil(tokenStr))
      break;

    line += ' '.repeat(token.loc.column - cursor) + tokenStr;
    cursor = token.loc.column + token.text.length;
  }

  return line;
}

/**
 * Other lines
 *
 * @export
 * @class ASTPreprocessorSyntaxLine
 * @extends {ASTPreprocessorNode}
 */
export class ASTPreprocessorSyntaxLine extends ASTPreprocessorNode {
  private outputTokens: Token[];

  constructor(
    loc: NodeLocation,
    public readonly tokens: Token[],
  ) {
    super(ASTPreprocessorKind.SyntaxStmt, loc);
  }

  isEmpty(): boolean {
    return !this.tokens.length;
  }

  toEmitterLine(): string {
    return formatAsmStmt(this.outputTokens);
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
    [, this.outputTokens] = interpreter.removeMacrosFromTokens(this.tokens);
  }
}
