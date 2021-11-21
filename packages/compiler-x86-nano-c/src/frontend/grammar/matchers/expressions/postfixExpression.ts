/* eslint-disable no-loop-func */
import {
  ASTCPostfixArrayExpression,
  ASTCPostfixExpression,
  ASTCPostfixFnExpression,
  ASTCArgumentsExpressionList,
} from '@compiler/x86-nano-c/frontend/ast';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {SyntaxError} from '@compiler/grammar/Grammar';
import {CGrammar} from '../shared';

import {primaryExpression} from './primaryExpression';
import {expression} from './expression';

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
export function postfixExpression(grammar: CGrammar): ASTCPostfixExpression {
  const {g} = grammar;
  let postfixExpressionNode: ASTCPostfixExpression = null;

  do {
    const startLoc = NodeLocation.fromTokenLoc(g.currentToken.loc);
    const newPostfixExpressionNode = g.try(() => <ASTCPostfixExpression> g.or(
      {
        primary: () => new ASTCPostfixExpression(
          startLoc,
          {
            primaryExpression: primaryExpression(grammar),
            postfixExpression: postfixExpressionNode,
          },
        ),

        array() {
          g.terminal('[');

          const postfix = new ASTCPostfixExpression(
            startLoc,
            {
              arrayExpression: new ASTCPostfixArrayExpression(startLoc, expression(grammar)),
              postfixExpression: postfixExpressionNode,
            },
          );

          g.terminal(']');
          return postfix;
        },

        // eslint-disable-next-line no-loop-func
        function() {
          g.terminal('(');

          const fnExpression = g.try(() => new ASTCPostfixFnExpression(
            startLoc,
            new ASTCArgumentsExpressionList(startLoc, expression(grammar).assignments),
          ));

          const postfix = new ASTCPostfixExpression(
            startLoc,
            {
              fnExpression,
              postfixExpression: postfixExpressionNode,
            },
          );

          g.terminal(')');
          return postfix;
        },
      },
    ));

    if (!newPostfixExpressionNode)
      break;

    postfixExpressionNode = newPostfixExpressionNode;
  } while (true);

  if (!postfixExpressionNode)
    throw new SyntaxError;

  return postfixExpressionNode;
}
