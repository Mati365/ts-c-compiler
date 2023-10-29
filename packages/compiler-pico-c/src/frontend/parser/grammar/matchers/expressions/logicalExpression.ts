import { TokenType } from '@ts-c-compiler/lexer';
import { CGrammar } from '../shared';
import { CReducePostfixOperatorsVisitor } from '../utils/CReducePostfixOperatorVisitor';
import { ASTCTreeNode } from '../../../ast';

import { bitwiseOrExpression } from './bitwiseExpression';
import { createLeftRecursiveOperatorMatcher } from '../utils';

const andOp = createLeftRecursiveOperatorMatcher({
  operator: TokenType.AND,
  parentExpression: bitwiseOrExpression,
}).op;

const orOp = createLeftRecursiveOperatorMatcher({
  operator: TokenType.OR,
  parentExpression: andOp,
}).op;

export function logicalOrExpression(
  grammar: CGrammar,
  reducePostFixOps: boolean = true,
): ASTCTreeNode {
  const expression = orOp(grammar);

  if (reducePostFixOps) {
    new CReducePostfixOperatorsVisitor().visit(expression);
  }

  return expression;
}
