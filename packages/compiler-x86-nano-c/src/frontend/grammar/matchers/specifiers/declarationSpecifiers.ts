import {SyntaxError} from '@compiler/grammar/Grammar';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {
  ASTCCompilerNode,
  ASTCDeclarationSpecifier, ASTCStorageClassSpecifiersList,
  ASTCTypeQualifiersList, ASTCTypeSpecifiersList,
} from '@compiler/x86-nano-c/frontend/ast';

import {CGrammar} from '../shared';
import {matchStorageClassSpecifier} from './storageClassSpecifier';
import {matchTypeQualifier} from './typeQualifier';
import {typeSpecifier} from './typeSpecifier';

/**
 * declaration_specifiers
 *  : storage_class_specifier
 *  | storage_class_specifier declaration_specifiers
 *  | type_specifier
 *  | type_specifier declaration_specifiers
 *  | type_qualifier
 *  | type_qualifier declaration_specifiers
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCAssignmentExpression}
 */
export function declarationSpecifiers(grammar: CGrammar): ASTCDeclarationSpecifier {
  const {g} = grammar;

  let loc: NodeLocation = null;
  const storageClassSpecifiers = new ASTCStorageClassSpecifiersList(null, []);
  const typeSpecifiers = new ASTCTypeSpecifiersList(null, []);
  const typeQualifiers = new ASTCTypeQualifiersList(null, []);

  do {
    const item = <ASTCCompilerNode> g.or(
      {
        storage() {
          const node = matchStorageClassSpecifier(grammar);
          return (storageClassSpecifiers.items.push(node), node);
        },
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

  const specifier = new ASTCDeclarationSpecifier(
    loc,
    storageClassSpecifiers,
    typeSpecifiers,
    typeQualifiers,
  );

  return specifier.dropEmpty();
}
