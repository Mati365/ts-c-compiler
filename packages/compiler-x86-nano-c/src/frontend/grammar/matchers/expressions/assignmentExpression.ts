import {CAssignOperator, CCOMPILER_ASSIGN_OPERATORS} from '@compiler/x86-nano-c/constants';

import {ASTCAssignmentExpression} from '@compiler/x86-nano-c/frontend/ast';
import {Token} from '@compiler/lexer/tokens';
import {CGrammar} from '../shared';
import {unaryExpression} from './unaryExpression';

function matchAssignmentOperator({g}: CGrammar): Token {
  return g.terminal(CCOMPILER_ASSIGN_OPERATORS as string[]);
}

/**
 * assignment_expression
 *  : conditional_expression
 *  | unary_expression assignment_operator assignment_expression
 *  ;
 *
 * @todo
 *  Add conditional_expression
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCAssignmentExpression}
 */
export function assignmentExpression(grammar: CGrammar): ASTCAssignmentExpression {
  const unaryNode = unaryExpression(grammar);
  const operator = matchAssignmentOperator(grammar);

  return new ASTCAssignmentExpression(
    unaryNode.loc,
    null,
    null,
    operator.text as CAssignOperator,
    assignmentExpression(grammar),
  );
}
