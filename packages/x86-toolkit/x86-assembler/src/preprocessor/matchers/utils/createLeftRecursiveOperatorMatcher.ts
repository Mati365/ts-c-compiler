/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import {empty} from '@compiler/grammar/matchers';
import {safeArray} from '@compiler/core/utils';
import {
  eatLeftRecursiveOperators,
  createBinOpIfBothSidesPresent,
} from '@compiler/grammar/utils';

import {CanBeArray} from '@compiler/core/types';
import {TokenType} from '@compiler/lexer/shared';
import {ASTPreprocessorNode, PreprocessorGrammar} from '../../constants';
import {ASTPreprocessorBinaryOpNode} from '../../nodes/ASTPreprocessorBinaryOpNode';

export function createLeftRecursiveOperatorMatcher(
  {
    operator,
    parentExpression,
  }: {
    operator: CanBeArray<TokenType>,
    parentExpression: (grammar: PreprocessorGrammar) => ASTPreprocessorNode,
  },
) {
  /**
   * @see
   * op = term op'
   * op = ε
   * op' = "OPERATOR" term op'
   */
  function op(g: PreprocessorGrammar): ASTPreprocessorNode {
    return <ASTPreprocessorNode> g.or(
      {
        value() {
          if (operator instanceof Array && operator.length > 1) {
            const root = new ASTPreprocessorBinaryOpNode(
              null,
              parentExpression(g),
              null,
            );

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
      },
    );
  }

  function opPrim(g: PreprocessorGrammar): ASTPreprocessorBinaryOpNode {
    return <ASTPreprocessorBinaryOpNode> g.or(
      {
        op() {
          const token = g.match(
            {
              types: safeArray(operator),
            },
          );

          return new ASTPreprocessorBinaryOpNode(
            token.type,
            parentExpression(g),
            opPrim(g),
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
