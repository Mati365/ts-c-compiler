/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import { TokenType } from '@ts-cc/lexer';

import { relationExpression } from './relationExpression';
import {
  createLeftRecursiveOperatorMatcher,
  PreprocessorReducePostfixOperatorsVisitor,
} from './utils';

import type { CPreprocessorGrammarDef } from '../../CPreprocessorGrammar';
import type { ASTCPreprocessorTreeNode } from '../../../ast';

/**
 * @see
 * term -> relation | ( logic )
 */
function term(g: CPreprocessorGrammarDef): ASTCPreprocessorTreeNode {
  const { currentToken: token } = g;
  const relation = relationExpression(g, false);

  if (relation) {
    return relation;
  }

  if (token.type === TokenType.BRACKET && token.text === '(') {
    g.consume();
    const expr = orOp(g);
    g.match({
      type: TokenType.BRACKET,
      terminal: ')',
    });

    return expr;
  }

  return null;
}

const andOp = createLeftRecursiveOperatorMatcher({
  operator: TokenType.AND,
  parentExpression: term,
}).op;

const orOp = createLeftRecursiveOperatorMatcher({
  operator: TokenType.OR,
  parentExpression: andOp,
}).op;

/**
 * Creates tree of advanced &&, || operators
 */
export function logicExpression(
  g: CPreprocessorGrammarDef,
  reducePostFixOps: boolean = true,
): ASTCPreprocessorTreeNode {
  const node = orOp(g);

  if (reducePostFixOps) {
    new PreprocessorReducePostfixOperatorsVisitor().visit(node);
  }

  return node;
}
