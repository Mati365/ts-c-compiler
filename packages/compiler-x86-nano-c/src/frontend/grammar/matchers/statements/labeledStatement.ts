import {CGrammar} from '../shared';
import {ASTCCompilerNode} from '../../../ast';

/**
 * labeled_statement
 *  : IDENTIFIER ':' statement
 *  | CASE constant_expression ':' statement
 *  | DEFAULT ':' statement
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCCompilerNode}
 */
export function labeledStatement(grammar: CGrammar): ASTCCompilerNode {
  const {g} = grammar;

  return <ASTCCompilerNode> g.or(
    {
    },
  );
}
