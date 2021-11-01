import {ASTCTreeNode} from '@compiler/x86-nano-c/frontend/ast';
import {CGrammar} from '../shared';
import {primaryExpression} from './primaryExpression';

/**
 * postfix_expression
 *  : primary_expression
 *  | postfix_expression '[' expression ']'
 *  | postfix_expression '(' ')'
 *  | postfix_expression '(' argument_expression_list ')'
 *  | postfix_expression '.' IDENTIFIER
 *  | postfix_expression PTR_OP IDENTIFIER
 *  | postfix_expression INC_OP
 *  | postfix_expression DEC_OP
 *  ;
 *
 * @todo
 *  Add postfix_expression recursive blocks
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCUnaryExpression}
 */
export function postfixExpression(grammar: CGrammar): ASTCTreeNode {
  const {g} = grammar;

  return <ASTCTreeNode> g.or(
    {
      primary: () => primaryExpression(grammar),
    },
  );
}
