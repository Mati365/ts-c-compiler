import {TokenType} from '@compiler/lexer/shared';
import {CGrammar} from '../shared';
import {ASTCTreeNode} from '../../../ast';

import {createLeftRecursiveOperatorMatcher} from '../utils';
import {additiveExpression} from './additiveExpression';

const shiftOp = createLeftRecursiveOperatorMatcher(
  [
    TokenType.BIT_SHIFT_LEFT,
    TokenType.BIT_SHIFT_RIGHT,
  ],
  additiveExpression,
).op;

export function shiftExpression(grammar: CGrammar): ASTCTreeNode {
  const {g} = grammar;

  return <ASTCTreeNode> g.or(
    {
      shiftOp: () => shiftOp(grammar),
      empty: () => additiveExpression(grammar),
    },
  );
}
