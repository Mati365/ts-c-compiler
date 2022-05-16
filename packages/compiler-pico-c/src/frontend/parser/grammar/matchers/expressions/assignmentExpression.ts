import {CAssignOperator, CCOMPILER_ASSIGN_OPERATORS} from '@compiler/pico-c/constants';
import {ASTCAssignmentExpression} from '@compiler/pico-c/frontend/parser/ast';
import {Token} from '@compiler/lexer/tokens';
import {CGrammar} from '../shared';
import {unaryExpression} from './unaryExpression';
import {conditionalExpression} from './conditionalExpression';

function matchAssignmentOperator({g}: CGrammar): Token {
  return g.terminal(CCOMPILER_ASSIGN_OPERATORS as string[]);
}

/**
 * assignment_expression
 *  : conditional_expression
 *  | unary_expression assignment_operator assignment_expression
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCAssignmentExpression}
 */
export function assignmentExpression(grammar: CGrammar): ASTCAssignmentExpression {
  const {g} = grammar;

  return <ASTCAssignmentExpression> g.or(
    {
      unary() {
        const unaryNode = unaryExpression(grammar);
        const operator = matchAssignmentOperator(grammar);

        return new ASTCAssignmentExpression(
          unaryNode.loc,
          null,
          unaryNode,
          operator.text as CAssignOperator,
          assignmentExpression(grammar),
        );
      },
      conditional() {
        const expression = conditionalExpression(grammar);

        return new ASTCAssignmentExpression(expression.loc, expression);
      },
    },
  );
}
