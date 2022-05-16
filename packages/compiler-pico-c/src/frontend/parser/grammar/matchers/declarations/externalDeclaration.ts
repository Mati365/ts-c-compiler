import {ASTCTreeNode} from '../../../ast';
import {CGrammar} from '../shared';

import {functionDefinition} from '../definitions/functionDefinition';
import {declaration} from './declaration';

/**
 * external_declaration
 *  : function_definition
 *  | declaration
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 */
export function externalDeclaration(grammar: CGrammar): ASTCTreeNode {
  const {g} = grammar;

  return <ASTCTreeNode> g.or(
    {
      functionDefinition: () => functionDefinition(grammar),
      declaration: () => declaration(grammar),
    },
  );
}
