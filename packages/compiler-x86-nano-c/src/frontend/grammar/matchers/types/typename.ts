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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function typename({g}: CGrammar): ASTCTypeName {
  return null;
}
