import { TokenType } from '@ts-cc/lexer';
import { CGrammar } from '../shared';
import { ASTCTreeNode } from '../../../ast';

import { equalityExpression } from './equalityExpression';
import {
  createLeftRecursiveOperatorMatcher,
  CReducePostfixOperatorsVisitor,
} from '../utils';

const andBitwiseOp = createLeftRecursiveOperatorMatcher({
  operator: TokenType.BIT_AND,
  parentExpression: equalityExpression,
}).op;

const xorBitwiseOp = createLeftRecursiveOperatorMatcher({
  operator: TokenType.POW,
  parentExpression: andBitwiseOp,
}).op;

const orBitwiseOp = createLeftRecursiveOperatorMatcher({
  operator: TokenType.BIT_OR,
  parentExpression: xorBitwiseOp,
}).op;

export function bitwiseOrExpression(
  grammar: CGrammar,
  reducePostFixOps: boolean = true,
): ASTCTreeNode {
  const expression = orBitwiseOp(grammar);

  if (reducePostFixOps) {
    new CReducePostfixOperatorsVisitor().visit(expression);
  }

  return expression;
}
