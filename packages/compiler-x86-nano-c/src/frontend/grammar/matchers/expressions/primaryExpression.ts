import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TokenType} from '@compiler/lexer/shared';
import {ASTCPrimaryExpression} from '@compiler/x86-nano-c/frontend/ast';
import {expression} from './expression';
import {CGrammar} from '../shared';

/**
 * primary_expression
 *  : IDENTIFIER
 *  | constant
 *  | string
 *  | '(' expression ')'
 *  | generic_selection
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCPrimaryExpression}
 */
export function primaryExpression(grammar: CGrammar): ASTCPrimaryExpression {
  const {g} = grammar;

  return <ASTCPrimaryExpression> g.or(
    {
      identifier() {
        const identifier = g.nonIdentifierKeyword();

        return new ASTCPrimaryExpression(
          NodeLocation.fromTokenLoc(identifier.loc),
          identifier,
        );
      },

      constant() {
        const constant = g.match(
          {
            types: [TokenType.NUMBER, TokenType.FLOAT_NUMBER],
          },
        );

        return new ASTCPrimaryExpression(
          NodeLocation.fromTokenLoc(constant.loc),
          null,
          constant,
        );
      },

      literal() {
        const literal = g.match(
          {
            type: TokenType.QUOTE,
          },
        );

        return new ASTCPrimaryExpression(
          NodeLocation.fromTokenLoc(literal.loc),
          null, null,
          literal.text,
        );
      },

      expr() {
        g.terminal('(');
        const expressionNode = expression(grammar);
        g.terminal(')');

        return new ASTCPrimaryExpression(
          expressionNode.loc,
          null, null, null,
          expressionNode,
        );
      },
    },
  );
}
