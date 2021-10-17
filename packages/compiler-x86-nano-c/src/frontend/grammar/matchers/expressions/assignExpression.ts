import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token, TokenType} from '@compiler/lexer/tokens';

import {CGrammar} from '../shared';
import {
  ASTCExpression,
  ASTCAssignExpression,
} from '../../../ast';

/**
  <expression> ::= <assignment-expression>
                | <expression> , <assignment-expression>

  <assignment-expression> ::= <conditional-expression>
                            | <unary-expression> <assignment-operator> <assignment-expression>
  */
export function assignOperator({g}: CGrammar): Token {
  return g.match(
    {
      types: [
        TokenType.ASSIGN,
        TokenType.MUL_ASSIGN,
        TokenType.DIV_ASSIGN,
        TokenType.MOD_ASSIGN,
        TokenType.ADD_ASSIGN,
        TokenType.SUB_ASSIGN,
        TokenType.SHIFT_LEFT_ASSIGN,
        TokenType.SHIFT_RIGHT_ASSIGN,
        TokenType.AND_ASSIGN,
        TokenType.XOR_ASSIGN,
        TokenType.OR_ASSIGN,
      ],
    },
  );
}

export function assignExpression(grammar: CGrammar): ASTCAssignExpression {
  const {g} = grammar;
  const unary = g.match(
    {
      type: TokenType.KEYWORD,
    },
  );

  const op = assignOperator(grammar);
  const expr = g.match(
    {
      type: TokenType.KEYWORD,
    },
  );

  g.match(
    {
      type: TokenType.SEMICOLON,
    },
  );

  return new ASTCAssignExpression(
    NodeLocation.fromTokenLoc(unary.loc),
    new ASTCExpression(null, [unary]),
    op.type,
    new ASTCExpression(null, [expr]),
  );
}
