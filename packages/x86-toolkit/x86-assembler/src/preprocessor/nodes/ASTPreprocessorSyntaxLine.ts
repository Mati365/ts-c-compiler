import { joinTokensWithSpaces } from '@compiler/lexer/utils/joinTokensTexts';

import { Token } from '@compiler/lexer/tokens';
import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';

import {
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/PreprocessorInterpreter';

import { ASTPreprocessorKind, ASTPreprocessorNode } from '../constants';

/**
 * Other lines
 */
export class ASTPreprocessorSyntaxLine extends ASTPreprocessorNode {
  private outputTokens: Token[];

  constructor(loc: NodeLocation, readonly tokens: Token[]) {
    super(ASTPreprocessorKind.SyntaxStmt, loc);
  }

  isEmpty(): boolean {
    return !this.tokens.length;
  }

  toEmitterLine(): string {
    return joinTokensWithSpaces(this.outputTokens);
  }

  toString(): string {
    const { kind, tokens } = this;

    return `${kind} stmt="${joinTokensWithSpaces(tokens)}"`;
  }

  /**
   * Exec interpreter on node
   */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    [, this.outputTokens] = interpreter.removeMacrosFromTokens(
      this.outputTokens ?? this.tokens,
    );
  }
}
