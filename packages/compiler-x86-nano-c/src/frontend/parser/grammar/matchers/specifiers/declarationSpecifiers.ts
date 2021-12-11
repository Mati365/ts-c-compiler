import {SyntaxError} from '@compiler/grammar/Grammar';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {
  ASTCAlignmentSpecifiersList,
  ASTCCompilerNode,
  ASTCDeclarationSpecifier,
  ASTCFunctionSpecifiersList,
  ASTCStorageClassSpecifiersList,
  ASTCTypeQualifiersList,
  ASTCTypeSpecifiersList,
} from '@compiler/x86-nano-c/frontend/parser/ast';

import {CGrammar} from '../shared';

import {matchStorageClassSpecifier} from './storageClassSpecifier';
import {matchTypeQualifier} from './typeQualifier';
import {matchFunctionSpecifier} from './functionSpecifier';
import {typeSpecifier} from './typeSpecifier';
import {alignmentSpecifier} from './alignmentSpecifier';

/**
 * declaration_specifiers
 *  : storage_class_specifier
 *  | storage_class_specifier declaration_specifiers
 *  | type_specifier
 *  | type_specifier declaration_specifiers
 *  | type_qualifier
 *  | type_qualifier declaration_specifiers
 *  | function_specifier declaration_specifiers
 *  | function_specifier
 *  | alignment_specifier declaration_specifiers
 *  | alignment_specifier
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
  const functionSpecifiers = new ASTCFunctionSpecifiersList(null, []);
  const alignmentSpecifiers = new ASTCAlignmentSpecifiersList(null, []);

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
        functionSpecifier() {
          const node = matchFunctionSpecifier(grammar);
          return (functionSpecifiers.items.push(node), node);
        },
        alignmentSpecifier() {
          const node = alignmentSpecifier(grammar);
          return (alignmentSpecifiers.items.push(node), node);
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

  return new ASTCDeclarationSpecifier(
    loc,
    storageClassSpecifiers,
    typeSpecifiers,
    typeQualifiers,
    functionSpecifiers,
    alignmentSpecifiers,
  ).dropEmpty();
}
