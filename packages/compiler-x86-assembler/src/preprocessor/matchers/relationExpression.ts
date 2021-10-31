/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {empty} from '@compiler/grammar/matchers';
import {isRelationOpToken} from '@compiler/lexer/utils/isRelationOpToken';

import {TokenType} from '@compiler/lexer/tokens';
import {
  ASTPreprocessorBinaryOpNode,
  createBinOpIfBothSidesPresent,
} from '../nodes/ASTPreprocessorBinaryOpNode';

import {
  PreprocessorGrammar,
  ASTPreprocessorNode,
} from '../constants';

import {ReducePostfixOperatorsVisitor} from './utils/ReducePostifxOperatorsVisitor';
import {mathExpression} from './mathExpression';

/**
 * @see
 * term -> mathExpr | ( mathExpr )
 */
function term(g: PreprocessorGrammar): ASTPreprocessorNode {
  const {currentToken: token} = g;

  if (token.type === TokenType.BRACKET && token.text === '(') {
    g.consume();
    const expr = mathExpression(g, false);
    g.match(
      {
        type: TokenType.BRACKET,
        terminal: ')',
      },
    );

    return expr;
  }

  return mathExpression(g, false);
}

/**
 * @see
 * rel = term rel'
 * rel = ε
 * rel' = ">" term rel'
 * rel' = "<" term rel'
 * rel' = "<=" term rel'
 * rel' = ">=" term rel'
 */
function relOp(g: PreprocessorGrammar): ASTPreprocessorNode {
  return <ASTPreprocessorNode> g.or(
    {
      rel() {
        return createBinOpIfBothSidesPresent(
          ASTPreprocessorBinaryOpNode,
          null,
          term(g),
          relOpPrim(g),
        );
      },
      empty,
    },
  );
}

function relOpPrim(g: PreprocessorGrammar): ASTPreprocessorNode {
  const {currentToken} = g;
  if (!isRelationOpToken(currentToken.type))
    return null;

  g.consume();
  return new ASTPreprocessorBinaryOpNode(
    currentToken.type,
    term(g),
    relOpPrim(g),
  );
}

/**
 * Creates expression with >, < etc
 *
 * @export
 * @param {PreprocessorGrammar} g
 * @param {boolean} [reducePostFixOps=true]
 * @returns {ASTPreprocessorNode}
 */
export function relationExpression(g: PreprocessorGrammar, reducePostFixOps: boolean = true): ASTPreprocessorNode {
  const node = relOp(g);

  if (reducePostFixOps)
    (new ReducePostfixOperatorsVisitor).visit(node);

  return node;
}
