/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import {empty} from '@compiler/grammar/matchers';

import {TokenType} from '@compiler/lexer/shared';
import {CGrammar} from '../shared';
import {
  ASTCBinaryOpNode,
  ASTCTreeNode,
  createBinOpIfBothSidesPresent,
} from '../../../ast';

export function createLeftRecursiveOperatorMatcher(
  operator: TokenType,
  parentExpression: (grammar: CGrammar) => ASTCTreeNode,
) {
  /**
   * @see
   * op = term op'
   * op = ε
   * op' = "OPERATOR" term op'
   */
  function op(grammar: CGrammar): ASTCTreeNode {
    const {g} = grammar;

    return <ASTCTreeNode> g.or(
      {
        value() {
          return createBinOpIfBothSidesPresent(
            ASTCBinaryOpNode,
            null,
            parentExpression(grammar),
            opPrim(grammar),
          );
        },
        empty,
      },
    );
  }

  function opPrim(grammar: CGrammar): ASTCTreeNode {
    const {g} = grammar;

    return <ASTCTreeNode> g.or(
      {
        op() {
          g.match(
            {
              type: operator,
            },
          );

          return new ASTCBinaryOpNode(
            operator,
            parentExpression(grammar),
            opPrim(grammar),
          );
        },
        empty,
      },
    );
  }

  return {
    op,
  };
}
