/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import { empty } from '@ts-c/grammar';
import { safeArray } from '@ts-c/core';
import { eatLeftRecursiveOperators } from '@ts-c/grammar';

import { CanBeArray } from '@ts-c/core';
import { TokenType } from '@ts-c/lexer';
import { CGrammar } from '../shared';
import {
  ASTCBinaryOpNode,
  ASTCTreeNode,
  createBinOpIfBothSidesPresent,
} from '../../../ast';

export function createLeftRecursiveOperatorMatcher({
  operator,
  parentExpression,
}: {
  operator: CanBeArray<TokenType>;
  parentExpression: (grammar: CGrammar) => ASTCTreeNode;
}) {
  /**
   * @see
   * op = term op'
   * op = ε
   * op' = "OPERATOR" term op'
   */
  function op(grammar: CGrammar): ASTCTreeNode {
    const { g } = grammar;

    return <ASTCTreeNode>g.or({
      value() {
        if (operator instanceof Array && operator.length > 1) {
          const root = new ASTCBinaryOpNode(
            null,
            parentExpression(grammar),
            null,
          );

          return eatLeftRecursiveOperators(
            g,
            root,
            operator,
            () => parentExpression(grammar),
            () => opPrim(grammar),
          );
        }

        return createBinOpIfBothSidesPresent(
          ASTCBinaryOpNode,
          null,
          parentExpression(grammar),
          opPrim(grammar),
        );
      },
      empty,
    });
  }

  function opPrim(grammar: CGrammar): ASTCTreeNode {
    const { g } = grammar;

    return <ASTCTreeNode>g.or({
      op() {
        const token = g.match({
          types: safeArray(operator),
        });

        return new ASTCBinaryOpNode(
          token.type,
          parentExpression(grammar),
          opPrim(grammar),
        );
      },
      empty,
    });
  }

  return {
    op,
  };
}
