import {TokenType} from '@compiler/lexer/shared';
import {CGrammar} from '../shared';
import {ASTCTreeNode} from '../../../ast';

import {createLeftRecursiveOperatorMatcher} from '../utils';
import {relationalExpression} from './relationalExpression';

const equalOp = createLeftRecursiveOperatorMatcher(
  {
    parentExpression: relationalExpression,
    operator: [
      TokenType.DIFFERS,
      TokenType.EQUAL,
    ],
  },
).op;

export function equalityExpression(grammar: CGrammar): ASTCTreeNode {
  const {g} = grammar;

  return <ASTCTreeNode> g.or(
    {
      equalOp: () => equalOp(grammar),
      empty: () => relationalExpression(grammar),
    },
  );
}
