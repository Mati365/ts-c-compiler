import { ASTCTypeName } from 'frontend/parser/ast';
import { CGrammar } from '../shared';

/**
 * type_name
 * : specifier_qualifier_list abstract_declarator
 * | specifier_qualifier_list
 * ;
 */
export function typename(grammar: CGrammar): ASTCTypeName {
  const { g, abstractDeclarator, qualifiersSpecifiers } = grammar;

  const specifierList = qualifiersSpecifiers();
  const declaratorNode = g.try(abstractDeclarator);

  return new ASTCTypeName(specifierList.loc, specifierList, declaratorNode);
}
