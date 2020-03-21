/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {empty} from '@compiler/grammar/matchers';

import {TokenType} from '@compiler/lexer/tokens';
import {ASTBinaryLogicOpNode, createBinOpIfBothSidesPresent} from '../nodes/ASTBinaryOpNode';
import {
  PreprocessorGrammar,
  ASTPreprocessorNode,
  ASTPreprocessorKind,
} from '../constants';

import {ReducePostfixOperatorsVisitor, mathExpression} from './mathExpression';

/**
 * @see
 * term -> mathExpr | ( logic )
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

  return mathExpression(g);
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
          ASTBinaryLogicOpNode,
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

        const [left, right] = [term(g), andOpPrim(g)];
        return new ASTBinaryLogicOpNode(
          TokenType.AND,
          left,
          right,
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
          ASTBinaryLogicOpNode,
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

        const [left, right] = [andOp(g), orOpPrim(g)];
        return new ASTBinaryLogicOpNode(
          TokenType.OR,
          left,
          right,
        );
      },
      empty,
    },
  );
}

export function logicExpression(g: PreprocessorGrammar): ASTPreprocessorNode {
  const node = orOp(g);

  (new ReducePostfixOperatorsVisitor(ASTPreprocessorKind.BinaryLogicOperator)).visit(node);

  return node;
}
