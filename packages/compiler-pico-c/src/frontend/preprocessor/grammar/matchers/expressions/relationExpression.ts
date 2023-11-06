/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import { createBinOpIfBothSidesPresent, empty } from '@ts-c-compiler/grammar';
import { isRelationOpToken } from '@ts-c-compiler/lexer';

import { TokenType } from '@ts-c-compiler/lexer';

import { PreprocessorReducePostfixOperatorsVisitor } from './utils';
import { mathExpression } from './mathExpression';

import type { CPreprocessorGrammarDef } from '../../CPreprocessorGrammar';
import {
  ASTPreprocessorBinaryOpNode,
  type ASTCPreprocessorTreeNode,
} from 'frontend/preprocessor/ast';

/**
 * @see
 * term -> mathExpr | ( mathExpr )
 */
function term(g: CPreprocessorGrammarDef): ASTCPreprocessorTreeNode {
  const { currentToken: token } = g;

  if (token.type === TokenType.BRACKET && token.text === '(') {
    g.consume();
    const expr = mathExpression(g, false);
    g.match({
      type: TokenType.BRACKET,
      terminal: ')',
    });

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
function relOp(g: CPreprocessorGrammarDef): ASTCPreprocessorTreeNode {
  return <ASTCPreprocessorTreeNode>g.or({
    rel() {
      return createBinOpIfBothSidesPresent(
        ASTPreprocessorBinaryOpNode,
        null,
        term(g),
        relOpPrim(g),
      );
    },
    empty,
  });
}

function relOpPrim(g: CPreprocessorGrammarDef): ASTCPreprocessorTreeNode {
  const { currentToken } = g;
  if (!isRelationOpToken(currentToken.type)) {
    return null;
  }

  g.consume();
  return new ASTPreprocessorBinaryOpNode(
    currentToken.type,
    term(g),
    relOpPrim(g),
  );
}

/**
 * Creates expression with >, < etc
 */
export function relationExpression(
  g: CPreprocessorGrammarDef,
  reducePostFixOps: boolean = true,
): ASTCPreprocessorTreeNode {
  const node = relOp(g);

  if (reducePostFixOps) {
    new PreprocessorReducePostfixOperatorsVisitor().visit(node);
  }

  return node;
}
