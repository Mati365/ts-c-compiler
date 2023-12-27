import { NodeLocation } from '@ts-c-compiler/grammar';

import { CGrammar } from '../shared';
import { ASTCCompoundExpressionStmt } from '../../../ast';
import { compoundStatement } from './compoundStatement';

/**
 * compound_expression_statement
 *  : '(' compound_statement ')
 *  ;
 */
export function compoundExpressionStatement(grammar: CGrammar) {
  const { g } = grammar;

  const startToken = g.terminal('(');
  const stmt = compoundStatement(grammar);
  g.terminal(')');

  return new ASTCCompoundExpressionStmt(
    NodeLocation.fromTokenLoc(startToken.loc),
    stmt,
  );
}
