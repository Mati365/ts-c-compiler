/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import { empty } from '@ts-cc/grammar';
import { safeArray } from '@ts-cc/core';
import { eatLeftRecursiveOperators, createBinOpIfBothSidesPresent } from '@ts-cc/grammar';

import { CanBeArray } from '@ts-cc/core';
import { TokenType } from '@ts-cc/lexer';

import {
  ASTPreprocessorBinaryOpNode,
  type ASTCPreprocessorTreeNode,
} from 'frontend/preprocessor/ast';

import { CPreprocessorGrammarDef } from 'frontend/preprocessor/grammar/CPreprocessorGrammar';

export function createLeftRecursiveOperatorMatcher({
  operator,
  parentExpression,
}: {
  operator: CanBeArray<TokenType>;
  parentExpression: (grammar: CPreprocessorGrammarDef) => ASTCPreprocessorTreeNode;
}) {
  /**
   * @see
   * op = term op'
   * op = ε
   * op' = "OPERATOR" term op'
   */
  function op(g: CPreprocessorGrammarDef): ASTCPreprocessorTreeNode {
    return <ASTCPreprocessorTreeNode>g.or({
      value() {
        if (operator instanceof Array && operator.length > 1) {
          const root = new ASTPreprocessorBinaryOpNode(null, parentExpression(g), null);

          return eatLeftRecursiveOperators(
            g,
            root,
            operator,
            () => parentExpression(g),
            () => opPrim(g),
          );
        }

        return createBinOpIfBothSidesPresent(
          ASTPreprocessorBinaryOpNode,
          null,
          parentExpression(g),
          opPrim(g),
        );
      },
      empty,
    });
  }

  function opPrim(g: CPreprocessorGrammarDef): ASTPreprocessorBinaryOpNode {
    return <ASTPreprocessorBinaryOpNode>g.or({
      op() {
        const token = g.match({
          types: safeArray(operator),
        });

        return new ASTPreprocessorBinaryOpNode(
          token.type,
          parentExpression(g),
          opPrim(g),
        );
      },
      empty,
    });
  }

  return {
    op,
  };
}
