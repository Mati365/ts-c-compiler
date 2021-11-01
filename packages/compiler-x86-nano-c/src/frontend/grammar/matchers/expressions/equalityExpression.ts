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

const equalOp = createLeftRecursiveOperatorMatcher(
  [
    TokenType.DIFFERS,
    TokenType.EQUAL,
  ],
  term,
).op;

export function equalityExpression(grammar: CGrammar): ASTCTreeNode {
  const {g} = grammar;

  return <ASTCTreeNode> g.or(
    {
      equalOp: () => equalOp(grammar),
      empty: () => term(grammar),
    },
  );
}
