/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {empty} from '@compiler/grammar/matchers';

import {TokenType} from '@compiler/lexer/tokens';
import {createBinOpIfBothSidesPresent, ASTPreprocessorBinaryOpNode} from '../nodes/ASTPreprocessorBinaryOpNode';

import {
  PreprocessorGrammar,
  ASTPreprocessorNode,
} from '../constants';

import {ReducePostfixOperatorsVisitor} from './utils/ReducePostifxOperatorsVisitor';
import {relationExpression} from './relationExpression';

/**
 * @see
 * term -> relation | ( logic )
 */
function term(g: PreprocessorGrammar): ASTPreprocessorNode {
  const {currentToken: token} = g;

  if (token.type === TokenType.BRACKET && token.text === '(') {
    g.consume();
    const expr = orOp(g);
    g.match(
      {
        type: TokenType.BRACKET,
        terminal: ')',
      },
    );

    return expr;
  }

  return relationExpression(g, false);
}

/**
 * @see
 * and = term and'
 * and = ε
 * and' = "&&" term and'
 */
function andOp(g: PreprocessorGrammar): ASTPreprocessorNode {
  return <ASTPreprocessorNode> g.or(
    {
      and() {
        return createBinOpIfBothSidesPresent(
          ASTPreprocessorBinaryOpNode,
          null,
          term(g),
          andOpPrim(g),
        );
      },
      empty,
    },
  );
}

function andOpPrim(g: PreprocessorGrammar): ASTPreprocessorNode {
  return <ASTPreprocessorNode> g.or(
    {
      and() {
        g.match(
          {
            type: TokenType.AND,
          },
        );

        return new ASTPreprocessorBinaryOpNode(
          TokenType.AND,
          term(g),
          andOpPrim(g),
        );
      },
      empty,
    },
  );
}

/**
 * @see
 * or = and or'
 * or = ε
 * or' = "||" and or'
 */
function orOp(g: PreprocessorGrammar): ASTPreprocessorNode {
  return <ASTPreprocessorNode> g.or(
    {
      value() {
        return createBinOpIfBothSidesPresent(
          ASTPreprocessorBinaryOpNode,
          null,
          andOp(g),
          orOpPrim(g),
        );
      },
      empty,
    },
  );
}

function orOpPrim(g: PreprocessorGrammar): ASTPreprocessorNode {
  return <ASTPreprocessorNode> g.or(
    {
      or() {
        g.match(
          {
            type: TokenType.OR,
          },
        );

        return new ASTPreprocessorBinaryOpNode(
          TokenType.OR,
          andOp(g),
          orOpPrim(g),
        );
      },
      empty,
    },
  );
}

/**
 * Creates tree of advanced &&, || operators
 *
 * @export
 * @param {PreprocessorGrammar} g
 * @param {boolean} [reducePostFixOps=true]
 * @returns {ASTPreprocessorNode}
 */
export function logicExpression(g: PreprocessorGrammar, reducePostFixOps: boolean = true): ASTPreprocessorNode {
  const node = orOp(g);

  if (reducePostFixOps)
    (new ReducePostfixOperatorsVisitor).visit(node);

  return node;
}
