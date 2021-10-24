import {ASTCInitializer} from '@compiler/x86-nano-c/frontend/ast';
import {CGrammar} from '../shared';
import {assignmentExpression} from '../expressions/assignmentExpression';

/**
 * initializer
 *  : assignment_expression
 *  | '{' initializer_list '}'
 *  | '{' initializer_list ',' '}'
 *  ;
 *
 * @todo
 *  Add initializers list
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCInitializer}
 */
export function initializer(grammar: CGrammar): ASTCInitializer {
  const assignmentExpressionNode = assignmentExpression(grammar);

  return new ASTCInitializer(
    assignmentExpressionNode.loc,
    assignmentExpressionNode,
  );
}
