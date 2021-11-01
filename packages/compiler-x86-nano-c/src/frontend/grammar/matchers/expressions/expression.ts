import * as R from 'ramda';

import {TokenType} from '@compiler/lexer/shared';
import {ASTCExpression, ASTCCompilerNode} from '../../../ast';
import {CGrammar} from '../shared';

/**
 * Fetch expression
 *
 * @param {CGrammar} c
 * @returns {ASTCExpression}
 */
export function expression(grammar: CGrammar): ASTCExpression {
  const {g, assignmentExpression} = grammar;
  const assignments: ASTCCompilerNode[] = [];

  do {
    assignments.push(
      assignmentExpression(),
    );

    const comma = g.match(
      {
        type: TokenType.COMMA,
        optional: true,
      },
    );

    if (!comma)
      break;
  } while (true);

  if (R.isEmpty(assignments))
    throw new SyntaxError;

  return new ASTCExpression(
    assignments[0].loc,
    assignments,
  );
}
