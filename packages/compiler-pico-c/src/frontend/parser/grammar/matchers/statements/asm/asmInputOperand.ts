import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCAsmStmtInputOperand } from '@compiler/pico-c/frontend/parser/ast';

import { CGrammar } from '../../shared';
import { primaryExpression } from '../../expressions/primaryExpression';

import { asmInputConstraint } from './asmInputConstraint';
import { asmSymbolicName } from './asmSymbolicName';

/**
 * @see {@link https://gcc.gnu.org/onlinedocs/gcc/Extended-Asm.html#InputOperands}
 *
 * [ [asmSymbolicName] ] constraint (expression)
 */
export function asmInputOperand(grammar: CGrammar): ASTCAsmStmtInputOperand {
  const { g } = grammar;

  const startLoc = g.currentToken;
  const hasSymbolicName = g.match({
    consume: false,
    optional: true,
    terminal: '[',
  });

  const symbolicName = hasSymbolicName && asmSymbolicName(grammar);
  const constraint = asmInputConstraint(grammar);

  g.terminal('(');

  const expression = primaryExpression(grammar);
  const endToken = g.terminal(')');

  return new ASTCAsmStmtInputOperand(
    new NodeLocation(startLoc.loc, endToken.loc),
    constraint,
    expression,
    symbolicName,
  );
}
