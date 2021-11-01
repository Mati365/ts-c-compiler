import {CGrammar} from '../shared';
import {
  ASTCCompilerNode,
  ASTCExpressionStatement,
} from '../../../ast';

import {expression} from '../expressions/expression';

/**
 * expression_statement
 *  : ';'
 *  | expression ';'
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCCompilerNode}
 */
export function expressionStatement(grammar: CGrammar): ASTCExpressionStatement {
  const {g} = grammar;

  return <ASTCCompilerNode> g.or(
    {
      expression() {
        const expressionNode = expression(grammar);
        g.terminal(';');

        return new ASTCExpressionStatement(expressionNode.loc, expressionNode);
      },

      empty() {
        g.terminal(';');
        return null;
      },
    },
  );
}
