import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TokenType} from '@compiler/lexer/shared';
import {CGrammar} from '../shared';
import {
  ASTCCompilerKind,
  ASTCTreeNode,
  ASTCValueNode,
} from '../../../ast';

import {createLeftRecursiveOperatorMatcher} from '../utils';
import {castExpression} from './castExpression';

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

const multiplicativeOp = createLeftRecursiveOperatorMatcher(
  {
    parentExpression: castExpression,
    operator: [
      TokenType.MUL,
      TokenType.DIV,
      TokenType.MOD,
    ],
  },
).op;

export function multiplicativeExpression(grammar: CGrammar): ASTCTreeNode {
  const {g} = grammar;

  return <ASTCTreeNode> g.or(
    {
      multiplicativeOp: () => multiplicativeOp(grammar),
      empty: () => term(grammar),
    },
  );
}
