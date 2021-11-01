/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {TokenType} from '@compiler/lexer/tokens';

import {
  PreprocessorGrammar,
  ASTPreprocessorNode,
} from '../constants';

import {relationExpression} from './relationExpression';
import {
  createLeftRecursiveOperatorMatcher,
  PreprocessorReducePostfixOperatorsVisitor,
} from './utils';

/**
 * @see
 * term -> relation | ( logic )
 */
function term(g: PreprocessorGrammar): ASTPreprocessorNode {
  const {currentToken: token} = g;
  const relation = relationExpression(g, false);

  if (relation)
    return relation;

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

  return null;
}

const andOp = createLeftRecursiveOperatorMatcher(
  {
    operator: TokenType.AND,
    parentExpression: term,
  },
).op;

const orOp = createLeftRecursiveOperatorMatcher(
  {
    operator: TokenType.OR,
    parentExpression: andOp,
  },
).op;

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
    (new PreprocessorReducePostfixOperatorsVisitor).visit(node);

  return node;
}
