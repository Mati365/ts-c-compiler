import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCAsmStmtOutputOperand } from 'frontend/parser/ast';

import { CGrammar } from '../../shared';

import { unaryExpression } from '../../expressions/unaryExpression';
import { asmOutputConstraint } from './asmOutputConstraint';
import { asmSymbolicName } from './asmSymbolicName';

/**
 * @see {@link https://gcc.gnu.org/onlinedocs/gcc/Extended-Asm.html#OutputOperands}
 *
 * [ [asmSymbolicName] ] constraint (variableName)
 */
export function asmOutputOperand(grammar: CGrammar): ASTCAsmStmtOutputOperand {
  const { g } = grammar;

  const startLoc = g.currentToken;
  const hasSymbolicName = g.match({
    consume: false,
    optional: true,
    terminal: '[',
  });

  const symbolicName = hasSymbolicName && asmSymbolicName(grammar);
  const constraint = asmOutputConstraint(grammar);
  g.terminal('(');

  const expression = unaryExpression(grammar);
  const endToken = g.terminal(')');

  return new ASTCAsmStmtOutputOperand(
    new NodeLocation(startLoc.loc, endToken.loc),
    constraint,
    expression,
    symbolicName,
  );
}
