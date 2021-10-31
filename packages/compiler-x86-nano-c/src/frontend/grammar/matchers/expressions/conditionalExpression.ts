import {SyntaxError} from '@compiler/grammar/Grammar';
import {ASTCConditionalExpression} from '../../../ast';
import {CGrammar} from '../shared';
import {logicalOrExpression} from './logicalExpression';

/**
 * conditional_expression
 * : logical_or_expression
 * | logical_or_expression '?' expression ':' conditional_expression
 * ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCConditionalExpression}
 */
export function conditionalExpression(grammar: CGrammar): ASTCConditionalExpression {
  const orExpression = logicalOrExpression(grammar);
  if (!orExpression)
    throw SyntaxError;

  return new ASTCConditionalExpression(
    orExpression.loc,
    orExpression,
  );
}
