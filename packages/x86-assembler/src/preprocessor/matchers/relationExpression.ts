/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import { empty } from '@ts-cc/grammar';
import { isRelationOpToken } from '@ts-cc/lexer';

import { TokenType } from '@ts-cc/lexer';
import {
  ASTPreprocessorBinaryOpNode,
  createBinOpIfBothSidesPresent,
} from '../nodes/ASTPreprocessorBinaryOpNode';

import { PreprocessorGrammar, ASTPreprocessorNode } from '../constants';

import { PreprocessorReducePostfixOperatorsVisitor } from './utils/PreprocessorReducePostifxOperatorsVisitor';
import { mathExpression } from './mathExpression';

/**
 * @see
 * term -> mathExpr | ( mathExpr )
 */
function term(g: PreprocessorGrammar): ASTPreprocessorNode {
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
function relOp(g: PreprocessorGrammar): ASTPreprocessorNode {
  return <ASTPreprocessorNode>g.or({
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

function relOpPrim(g: PreprocessorGrammar): ASTPreprocessorNode {
  const { currentToken } = g;
  if (!isRelationOpToken(currentToken.type)) {
    return null;
  }

  g.consume();
  return new ASTPreprocessorBinaryOpNode(currentToken.type, term(g), relOpPrim(g));
}

/**
 * Creates expression with >, < etc
 */
export function relationExpression(
  g: PreprocessorGrammar,
  reducePostFixOps: boolean = true,
): ASTPreprocessorNode {
  const node = relOp(g);

  if (reducePostFixOps) {
    new PreprocessorReducePostfixOperatorsVisitor().visit(node);
  }

  return node;
}
