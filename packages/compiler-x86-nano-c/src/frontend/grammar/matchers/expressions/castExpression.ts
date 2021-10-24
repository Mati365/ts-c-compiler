import {ASTCCastExpression} from '@compiler/x86-nano-c/frontend/ast';
import {CGrammar} from '../shared';

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
export function castExpression(grammar: CGrammar): ASTCCastExpression {
  const {g, unaryExpression} = grammar;

  return <ASTCCastExpression> g.or(
    {
      unary() {
        const unaryNode = unaryExpression();

        return new ASTCCastExpression(unaryNode.loc, unaryNode);
      },
    },
  );
}
