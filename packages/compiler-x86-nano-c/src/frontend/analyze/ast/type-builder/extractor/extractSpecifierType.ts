/* eslint-disable @typescript-eslint/no-use-before-define */
import * as R from 'ramda';

import {CTypeQualifier} from '@compiler/x86-nano-c/constants';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../../errors/CTypeCheckError';
import {CType, CPrimitiveType} from '../../../types';
import {TreeTypeBuilderVisitor} from '../builder/CTreeTypeBuilderVisitor';
import {CNamedTypedEntry} from '../../../scope/variables/CNamedTypedEntry';
import {
  DeclaratorExtractorAttrs,
  SpecifierResolverAttrs,
  TypeResolverAttrs,
} from '../constants/types';

import {extractEnumTypeFromNode} from './extractEnumTypeFromNode';
import {extractStructTypeFromNode} from './extractStructTypeFromNode';

/**
 * Extract type from ParameterDeclarationSpecifier
 *
 * @see
 *  It can both resolve by name or create new type!
 *
 * @export
 * @param {SpecifierResolverAttrs} attrs
 * @return {CType}
 */
export function extractSpecifierType(
  {
    context,
    specifier,
  }: SpecifierResolverAttrs,
): CType {
  if (!specifier)
    return null;

  const {typeQualifiers, typeSpecifiers} = specifier;
  if (!typeSpecifiers)
    return null;

  const qualifiers: CTypeQualifier[] = typeQualifiers?.items;
  const {primitives, structs, enums} = typeSpecifiers.getGroupedSpecifiers();
  const [hasPrimitives, hasStructs, hasEnums] = [
    !R.isEmpty(primitives),
    !R.isEmpty(structs),
    !R.isEmpty(enums),
  ];

  if ((+hasPrimitives + +hasStructs + +hasEnums) > 1 || structs.length > 1 || enums.length > 1)
    throw new CTypeCheckError(CTypeCheckErrorCode.INCORRECT_TYPE_SPECIFIERS);

  if (hasPrimitives) {
    return (
      CPrimitiveType
        .ofParserSource(
          {
            arch: context.config.arch,
            specifiers: R.pluck('specifier', primitives),
            qualifiers,
          },
        )
        .unwrapOrThrow()
    );
  }

  if (hasEnums || hasStructs) {
    let typeName: string = null;

    if (hasStructs) {
      const structSpecifier = structs[0].structOrUnionSpecifier;

      // declare + definition
      if (structSpecifier.hasDeclarationList()) {
        return extractStructTypeFromNode(
          {
            extractNamedEntryFromDeclarator,
            extractSpecifierType,
            structSpecifier,
            context,
          },
        );
      }

      // access by name
      typeName = structSpecifier.name.text;
    } else {
      const enumSpecifier = enums[0].enumSpecifier;

      // declare + definition
      if (enumSpecifier.hasEnumerations()) {
        return extractEnumTypeFromNode(
          {
            extractNamedEntryFromDeclarator,
            extractSpecifierType,
            enumSpecifier,
            context,
          },
        );
      }

      // access by name
      typeName = enumSpecifier.name.text;
    }

    const type = context.scope.findType(
      typeName,
      {
        struct: hasStructs,
        enumerator: hasEnums,
      },
    );

    if (!type) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.UNKNOWN_TYPE,
        null,
        {
          typeName,
        },
      );
    }

    return type;
  }

  return null;
}

/**
 * Extract return type from declaration
 *
 * @export
 * @param {TypeResolverAttrs} attrs
 * @returns {CNamedTypedEntry}
 * @return {CNamedTypedEntry}
 */
export function extractNamedEntryFromDeclaration(
  {
    context,
    declaration,
  }: TypeResolverAttrs,
): CNamedTypedEntry {
  const {specifier, declarator} = declaration;
  const type = extractSpecifierType(
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

/**
 * Extract name => type pair from declarator nodes
 *
 * @export
 * @returns {CNamedTypedEntry}
 * @param {DeclaratorExtractorAttrs} object
 */
export function extractNamedEntryFromDeclarator(
  {
    context,
    type,
    declarator,
  }: DeclaratorExtractorAttrs,
): CNamedTypedEntry {
  if (!type) {
    throw new CTypeCheckError(
      CTypeCheckErrorCode.UNKNOWN_DECLARATOR_ENTRY_TYPE,
      declarator.loc.start,
    );
  }

  const buildEntry = (
    new TreeTypeBuilderVisitor(type)
      .setContext(context)
      .visit(declarator)
      .getBuiltEntry()
  );

  if (buildEntry.isAnonymous() || !buildEntry.unwrap()?.type) {
    throw new CTypeCheckError(
      CTypeCheckErrorCode.UNKNOWN_DECLARATOR_ENTRY_IDENTIFIER,
      declarator.loc.start,
    );
  }

  return buildEntry;
}
