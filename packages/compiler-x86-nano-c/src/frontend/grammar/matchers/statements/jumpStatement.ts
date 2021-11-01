import {CGrammar} from '../shared';
import {ASTCCompilerNode} from '../../../ast';

/**
 * jump_statement
 *  : GOTO IDENTIFIER ';'
 *  | CONTINUE ';'
 *  | BREAK ';'
 *  | RETURN ';'
 *  | RETURN expression ';'
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCCompilerNode}
 */
export function jumpStatement(grammar: CGrammar): ASTCCompilerNode {
  const {g} = grammar;

  return <ASTCCompilerNode> g.or(
    {
    },
  );
}
