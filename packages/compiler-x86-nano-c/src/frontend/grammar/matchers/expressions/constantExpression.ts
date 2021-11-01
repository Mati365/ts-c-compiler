import {ASTCConstantExpression} from '../../../ast';
import {CGrammar} from '../shared';

import {conditionalExpression} from './conditionalExpression';

/**
 * Fetch constant expression
 *
 * @param {CGrammar} c
 * @returns {ASTCConstantExpression}
 */
export function constantExpression(grammar: CGrammar): ASTCConstantExpression {
  const expr = conditionalExpression(grammar);

  return new ASTCConstantExpression(
    expr.loc,
    expr,
  );
}
