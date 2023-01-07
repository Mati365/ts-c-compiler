import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { TokenKind, TokenType } from '@compiler/lexer/shared';
import { ASTCPrimaryExpression } from '@compiler/pico-c/frontend/parser/ast';
import { expression } from './expression';
import { CGrammar } from '../shared';
import { CGrammarError, CGrammarErrorCode } from '../../errors/CGrammarError';

/**
 * primary_expression
 *  : IDENTIFIER
 *  | constant
 *  | string
 *  | '(' expression ')'
 *  | generic_selection
 *  ;
 */
export function primaryExpression(grammar: CGrammar): ASTCPrimaryExpression {
  const { g } = grammar;

  return <ASTCPrimaryExpression>g.or({
    identifier() {
      const identifier = g.nonIdentifierKeyword();

      return new ASTCPrimaryExpression(
        NodeLocation.fromTokenLoc(identifier.loc),
        identifier,
      );
    },

    constant() {
      const constant = g.match({
        types: [TokenType.NUMBER, TokenType.FLOAT_NUMBER],
      });

      return new ASTCPrimaryExpression(
        NodeLocation.fromTokenLoc(constant.loc),
        null,
        constant,
      );
    },

    literal() {
      const literal = g.match({
        type: TokenType.QUOTE,
      });

      // handle 'a'
      if (literal.kind === TokenKind.SINGLE_QUOTE) {
        if (literal.text.length !== 1) {
          throw new CGrammarError(
            CGrammarErrorCode.INCORRECT_CHAR_LITERAL_LENGTH,
            literal.loc,
            {
              text: literal.text,
            },
          );
        }

        return new ASTCPrimaryExpression(
          NodeLocation.fromTokenLoc(literal.loc),
          null,
          null,
          null,
          literal.text,
        );
      }

      // handle "a"
      return new ASTCPrimaryExpression(
        NodeLocation.fromTokenLoc(literal.loc),
        null,
        null,
        literal.text,
      );
    },

    expr() {
      g.terminal('(');
      const expressionNode = expression(grammar);
      g.terminal(')');

      return new ASTCPrimaryExpression(
        expressionNode.loc,
        null,
        null,
        null,
        null,
        expressionNode,
      );
    },
  });
}
