import {
  ASTCDeclarationSpecifier,
  ASTCDeclarator,
} from '@compiler/x86-nano-c/frontend/parser/ast';

import {TypeCheckerContext} from '../TypeCheckerContext';
import {CNamedTypedEntry} from '../types';

import {extractNamedEntryFromDeclarator} from './extractNamedEntryFromDeclarator';
import {extractTypeFromDeclarationSpecifier} from './extractTypeFromDeclarationSpecifier';

export type DeclarationExtractorAttrs = {
  context: TypeCheckerContext,
  declaration: {
    specifier: ASTCDeclarationSpecifier,
    declarator?: ASTCDeclarator,
  },
};

/**
 * Extract return type from declaration
 *
 * @export
 * @param {DeclarationExtractorAttrs} attrs
 * @returns {CNamedTypedEntry}
 * @return {CNamedTypedEntry}
 */
export function extractNamedEntryFromDeclaration(
  {
    context,
    declaration,
  }: DeclarationExtractorAttrs,
): CNamedTypedEntry {
  const {specifier, declarator} = declaration;
  const type = extractTypeFromDeclarationSpecifier(
    {
      specifier,
      context,
    },
  );

  // used in function declarations
  if (!declarator)
    return CNamedTypedEntry.ofAnonymousType(type);

  return extractNamedEntryFromDeclarator(
    {
      context,
      declarator,
      type,
    },
  );
}
