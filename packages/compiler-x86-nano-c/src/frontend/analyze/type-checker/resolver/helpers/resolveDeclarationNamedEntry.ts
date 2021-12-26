import {TypeResolverAttrs} from '../constants/types';
import {CNamedTypedEntry} from '../../types';

import {
  resolveSpecifierType,
  extractNamedEntryFromDeclarator,
} from './resolveSpecifierType';

/**
 * Extract return type from declaration
 *
 * @export
 * @param {TypeResolverAttrs} attrs
 * @returns {CNamedTypedEntry}
 * @return {CNamedTypedEntry}
 */
export function resolveDeclarationNamedEntry(
  {
    context,
    declaration,
  }: TypeResolverAttrs,
): CNamedTypedEntry {
  const {specifier, declarator} = declaration;
  const type = resolveSpecifierType(
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
