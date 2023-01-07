import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';

import { CCompilerKeyword } from '@compiler/pico-c/constants';
import { CGrammar } from '../shared';
import {
  ASTCCompilerNode,
  ASTCIfStatement,
  ASTCSwitchStatement,
} from '../../../ast';

import { expression } from '../expressions/expression';

/**
 * selection_statement
 *  : IF '(' expression ')' statement ELSE statement
 *  | IF '(' expression ')' statement
 *  | SWITCH '(' expression ')' statement
 *  ;
 */
export function selectionStatement(grammar: CGrammar): ASTCCompilerNode {
  const { g, statement } = grammar;

  return <ASTCCompilerNode>g.or({
    if() {
      const startToken = g.identifier(CCompilerKeyword.IF);

      g.terminal('(');
      const logicalExpression = expression(grammar);
      g.terminal(')');

      const trueExpression = statement();
      const elseStmt = g.identifier(CCompilerKeyword.ELSE, true);
      const falseExpression = elseStmt && statement();

      return new ASTCIfStatement(
        NodeLocation.fromTokenLoc(startToken.loc),
        logicalExpression,
        trueExpression,
        falseExpression,
      );
    },

    switch() {
      const startToken = g.identifier(CCompilerKeyword.SWITCH);

      g.terminal('(');
      const valueExpression = expression(grammar);
      g.terminal(')');

      return new ASTCSwitchStatement(
        NodeLocation.fromTokenLoc(startToken.loc),
        valueExpression,
        statement(),
      );
    },
  });
}
