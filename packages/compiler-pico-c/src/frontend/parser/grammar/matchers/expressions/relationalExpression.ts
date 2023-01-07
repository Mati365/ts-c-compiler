import { TokenType } from '@compiler/lexer/shared';
import { CGrammar } from '../shared';
import { ASTCTreeNode } from '../../../ast';

import { createLeftRecursiveOperatorMatcher } from '../utils';
import { shiftExpression } from './shiftExpression';

const relationOp = createLeftRecursiveOperatorMatcher({
  parentExpression: shiftExpression,
  operator: [
    TokenType.LESS_THAN,
    TokenType.LESS_EQ_THAN,
    TokenType.GREATER_THAN,
    TokenType.GREATER_EQ_THAN,
  ],
}).op;

export function relationalExpression(grammar: CGrammar): ASTCTreeNode {
  const { g } = grammar;

  return <ASTCTreeNode>g.or({
    equalOp: () => relationOp(grammar),
    empty: () => shiftExpression(grammar),
  });
}
