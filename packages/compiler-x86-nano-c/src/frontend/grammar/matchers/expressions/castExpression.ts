import {ASTCCastExpression, ASTCTreeNode} from '@compiler/x86-nano-c/frontend/ast';
import {CGrammar} from '../shared';
import {typename} from '../types';

/**
 * cast_expression
 *  : unary_expression
 *  | '(' type_name ')' cast_expression
 *  ;
 *
 * @todo
 *  Add typename cast expression
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCAssignmentExpression}
 */
export function castExpression(grammar: CGrammar): ASTCTreeNode {
  const {g, unaryExpression} = grammar;

  return <ASTCTreeNode> g.or(
    {
      cast() {
        g.match(
          {
            terminal: '(',
          },
        );
        const type = typename(grammar);
        g.match(
          {
            terminal: ')',
          },
        );

        return new ASTCCastExpression(
          type.loc,
          type,
          unaryExpression(),
        );
      },
      unary: unaryExpression,
    },
  );
}
