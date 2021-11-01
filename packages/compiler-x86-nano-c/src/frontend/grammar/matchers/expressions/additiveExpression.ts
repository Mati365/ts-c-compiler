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

const additiveOp = createLeftRecursiveOperatorMatcher(
  [
    TokenType.PLUS,
    TokenType.MINUS,
  ],
  term,
).op;

export function additiveExpression(grammar: CGrammar): ASTCTreeNode {
  const {g} = grammar;

  return <ASTCTreeNode> g.or(
    {
      additiveOp: () => additiveOp(grammar),
      empty: () => term(grammar),
    },
  );
}
