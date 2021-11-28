import {CCompilerKeyword, CCOMPILER_UNARY_OPERATORS, CUnaryCastOperator} from '@compiler/x86-nano-c/constants';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';
import {TokenType} from '@compiler/lexer/shared';
import {CGrammar} from '../shared';
import {
  ASTCUnaryExpression,
  ASTCIncUnaryExpression,
  ASTCDecUnaryExpression,
  ASTCCastUnaryExpression,
  ASTCSizeofUnaryExpression,
} from '../../../ast';

import {typename} from '../types/typename';
import {postfixExpression} from './postfixExpression';
import {castExpression} from './castExpression';

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
        const castExpressionNode = castExpression(grammar);

        return new ASTCUnaryExpression(
          loc,
          null,
          new ASTCCastUnaryExpression(
            loc,
            operator.text as CUnaryCastOperator,
            castExpressionNode,
          ),
        );
      },

      sizeofUnary() {
        g.identifier(CCompilerKeyword.SIZEOF);

        const unaryExpressionNode = unaryExpression(grammar);

        return new ASTCSizeofUnaryExpression(
          unaryExpressionNode.loc,
          null, unaryExpressionNode,
        );
      },

      sizeofTypename() {
        g.identifier(CCompilerKeyword.SIZEOF);
        g.terminal('(');
        const typenameNode = typename(grammar);
        g.terminal(')');

        return new ASTCSizeofUnaryExpression(typenameNode.loc, typenameNode);
      },
    },
  );
}
