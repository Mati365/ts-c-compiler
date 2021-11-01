/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import {TokenType} from '@compiler/lexer/shared';
import {CGrammar} from '../shared';
import {CReducePostfixOperatorsVisitor} from '../utils/CReducePostfixOperatorVisitor';
import {ASTCTreeNode} from '../../../ast';

import {bitwiseOrExpression} from './bitwiseExpression';
import {createLeftRecursiveOperatorMatcher} from '../utils';

const andOp = createLeftRecursiveOperatorMatcher(TokenType.AND, bitwiseOrExpression).op;
const orOp = createLeftRecursiveOperatorMatcher(TokenType.OR, andOp).op;

export function logicalOrExpression(grammar: CGrammar, reducePostFixOps: boolean = true): ASTCTreeNode {
  const expression = orOp(grammar);

  if (reducePostFixOps)
    (new CReducePostfixOperatorsVisitor).visit(expression);

  return expression;
}
