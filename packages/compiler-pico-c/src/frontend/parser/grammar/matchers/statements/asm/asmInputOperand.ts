import { NodeLocation } from '@ts-cc/grammar';
import { ASTCAsmStmtInputOperand } from 'frontend/parser/ast';
import { expression } from '../../expressions/expression';

import { CGrammar } from '../../shared';

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

  const exprResult = expression(grammar);
  const endToken = g.terminal(')');

  return new ASTCAsmStmtInputOperand(
    new NodeLocation(startLoc.loc, endToken.loc),
    constraint,
    exprResult,
    symbolicName,
  );
}
