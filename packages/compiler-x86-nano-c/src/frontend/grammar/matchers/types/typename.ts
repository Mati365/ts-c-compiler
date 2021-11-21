import {ASTCTypeName} from '@compiler/x86-nano-c/frontend/ast';
import {CGrammar} from '../shared';

/**
 * type_name
 * : specifier_qualifier_list abstract_declarator
 * | specifier_qualifier_list
 * ;
 *
 * @param {CGrammar} grammar
 * @param {boolean} optional
 */
export function typename(grammar: CGrammar): ASTCTypeName {
  const {g, abstractDeclarator, qualifiersSpecifiers} = grammar;

  const specifierList = qualifiersSpecifiers();
  const declaratorNode = g.try(abstractDeclarator);

  return new ASTCTypeName(
    specifierList.loc,
    specifierList,
    declaratorNode,
  );
}
