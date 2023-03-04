import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { TokenType } from '@compiler/lexer/shared';
import { CCompilerKeyword } from '@compiler/pico-c/constants';

import { ASTCAsmStatement } from '../../../ast';
import { CGrammar } from '../shared';

/**
 * asm asm-qualifiers ( AssemblerTemplate
 *                    : OutputOperands
 *                    : InputOperands
 *                    : Clobbers
 *                    : GotoLabels)
 */
export function asmStatement(grammar: CGrammar): ASTCAsmStatement {
  const { g } = grammar;

  const startToken = g.identifier(CCompilerKeyword.ASM);
  g.terminal('(');

  const expression = g.match({
    type: TokenType.QUOTE,
  });

  g.terminal(')');
  g.terminalType(TokenType.SEMICOLON);

  return new ASTCAsmStatement(
    NodeLocation.fromTokenLoc(startToken.loc),
    expression.text,
  );
}
