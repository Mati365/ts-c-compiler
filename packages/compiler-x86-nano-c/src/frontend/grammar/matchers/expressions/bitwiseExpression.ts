/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import {TokenType} from '@compiler/lexer/shared';
import {CGrammar} from '../shared';
import {ASTCTreeNode} from '../../../ast';

import {equalityExpression} from './equalityExpression';
import {
  createLeftRecursiveOperatorMatcher,
  CReducePostfixOperatorsVisitor,
} from '../utils';

const andBitwiseOp = createLeftRecursiveOperatorMatcher(TokenType.BIT_AND, equalityExpression).op;
const xorBitwiseOp = createLeftRecursiveOperatorMatcher(TokenType.POW, andBitwiseOp).op;
const orBitwiseOp = createLeftRecursiveOperatorMatcher(TokenType.BIT_OR, xorBitwiseOp).op;

export function bitwiseOrExpression(grammar: CGrammar, reducePostFixOps: boolean = true): ASTCTreeNode {
  const expression = orBitwiseOp(grammar);

  if (reducePostFixOps)
    (new CReducePostfixOperatorsVisitor).visit(expression);

  return expression;
}
