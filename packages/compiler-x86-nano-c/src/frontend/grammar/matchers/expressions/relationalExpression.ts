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

const relationOp = createLeftRecursiveOperatorMatcher(
  [
    TokenType.LESS_THAN,
    TokenType.LESS_EQ_THAN,
    TokenType.GREATER_THAN,
    TokenType.GREATER_EQ_THAN,
  ],
  term,
).op;

export function relationalExpression(grammar: CGrammar): ASTCTreeNode {
  const {g} = grammar;

  return <ASTCTreeNode> g.or(
    {
      equalOp: () => relationOp(grammar),
      empty: () => term(grammar),
    },
  );
}
