import {SyntaxError} from '@compiler/grammar/Grammar';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {
  ASTCCompilerNode,
  ASTCSpecifiersQualifiersList,
  ASTCTypeQualifiersList,
  ASTCTypeSpecifiersList,
} from '@compiler/x86-nano-c/frontend/parser/ast';

import {CGrammar} from '../shared';

import {matchTypeQualifier} from './typeQualifier';
import {typeSpecifier} from './typeSpecifier';

/**
 * specifier_qualifier_list
 *  : type_specifier specifier_qualifier_list
 *  | type_specifier
 *  | type_qualifier specifier_qualifier_list
 *  | type_qualifier
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCSpecifiersQualifiersList}
 */
export function qualifiersSpecifiers(grammar: CGrammar): ASTCSpecifiersQualifiersList {
  const {g} = grammar;

  let loc: NodeLocation = null;
  const typeSpecifiers = new ASTCTypeSpecifiersList(null, []);
  const typeQualifiers = new ASTCTypeQualifiersList(null, []);

  do {
    const item = <ASTCCompilerNode> g.or(
      {
        specifier() {
          const node = typeSpecifier(grammar);
          return (typeSpecifiers.items.push(node), node);
        },
        qualifier() {
          const node = matchTypeQualifier(grammar);
          return (typeQualifiers.items.push(node), node);
        },
        empty() {
          return null;
        },
      },
    );

    if (!item)
      break;

    if (!loc)
      loc = item.loc;
  } while (true);

  if (!loc)
    throw new SyntaxError;

  return new ASTCSpecifiersQualifiersList(
    loc,
    typeSpecifiers,
    typeQualifiers,
  ).dropEmpty();
}
