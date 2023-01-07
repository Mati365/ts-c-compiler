import {
  ASTCCastExpression,
  ASTCTreeNode,
} from '@compiler/pico-c/frontend/parser/ast';
import { CGrammar } from '../shared';
import { typename } from '../types';

/**
 * cast_expression
 *  : unary_expression
 *  | '(' type_name ')' cast_expression
 *  ;
 */
export function castExpression(grammar: CGrammar): ASTCTreeNode {
  const { g, unaryExpression } = grammar;

  return <ASTCTreeNode>g.or({
    unary: unaryExpression,
    cast() {
      g.terminal('(');
      const type = typename(grammar);
      g.terminal(')');

      return new ASTCCastExpression(type.loc, type, unaryExpression());
    },
  });
}
