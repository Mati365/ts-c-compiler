import {CCOMPILER_UNARY_OPERATORS, CUnaryCastOperator} from '@compiler/x86-nano-c/constants';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';
import {TokenType} from '@compiler/lexer/shared';
import {CGrammar} from '../shared';
import {
  ASTCUnaryExpression,
  ASTCIncUnaryExpression,
  ASTCDecUnaryExpression,
  ASTCCastUnaryExpression,
} from '../../../ast';

import {postfixExpression} from './postfixExpression';

function matchUnaryOperator({g}: CGrammar): Token {
  return g.terminal(CCOMPILER_UNARY_OPERATORS as string[]);
}

/**
 * unary_expression
 *  : postfix_expression
 *  | INC_OP unary_expression
 *  | DEC_OP unary_expression
 *  | unary_operator cast_expression
 *  | SIZEOF unary_expression
 *  | SIZEOF '(' type_name ')'
 *
 * @todo
 *  Add sizeof expressions
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCUnaryExpression}
 */
export function unaryExpression(grammar: CGrammar): ASTCUnaryExpression {
  const {g} = grammar;

  return <ASTCUnaryExpression> g.or(
    {
      postfix: () => postfixExpression(grammar),

      dec() {
        const loc = NodeLocation.fromTokenLoc(
          g.match(
            {
              type: TokenType.DECREMENT,
            },
          ).loc,
        );

        return new ASTCUnaryExpression(
          loc,
          null, null,
          new ASTCDecUnaryExpression(loc, unaryExpression(grammar)),
        );
      },

      inc() {
        const loc = NodeLocation.fromTokenLoc(
          g.match(
            {
              type: TokenType.INCREMENT,
            },
          ).loc,
        );

        return new ASTCUnaryExpression(
          loc,
          null, null, null,
          new ASTCIncUnaryExpression(loc, unaryExpression(grammar)),
        );
      },

      cast() {
        const operator = matchUnaryOperator(grammar);
        const loc = NodeLocation.fromTokenLoc(operator.loc);

        return new ASTCUnaryExpression(
          loc,
          null,
          new ASTCCastUnaryExpression(
            loc,
            operator.text as CUnaryCastOperator,
            null,
          ),
        );
      },
    },
  );
}
