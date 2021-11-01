/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TokenType} from '@compiler/lexer/shared';
import {CGrammar} from '../shared';
import {
  ASTCCompilerKind,
  ASTCTreeNode,
  ASTCValueNode,
} from '../../../ast';

import {createLeftRecursiveOperatorMatcher} from '../utils';

function term({g}: CGrammar) {
  const token = g.match(
    {
      type: TokenType.NUMBER,
    },
  );

  return new ASTCValueNode(
    ASTCCompilerKind.Value,
    NodeLocation.fromTokenLoc(token.loc),
    [token],
  );
}

const shiftOp = createLeftRecursiveOperatorMatcher(
  [
    TokenType.BIT_SHIFT_LEFT,
    TokenType.BIT_SHIFT_RIGHT,
  ],
  term,
).op;

export function shiftExpression(grammar: CGrammar): ASTCTreeNode {
  const {g} = grammar;

  return <ASTCTreeNode> g.or(
    {
      shiftOp: () => shiftOp(grammar),
      empty: () => term(grammar),
    },
  );
}
