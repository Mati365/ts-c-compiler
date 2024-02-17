import { pipe } from 'fp-ts/function';
import { unwrapEitherOrThrow } from '@ts-cc/core';

import { ASTCUnionSpecifier } from 'frontend/parser';
import { CTypeCheckError, CTypeCheckErrorCode } from '../../../errors/CTypeCheckError';

import { CUnionType } from '../../../types';
import { TypeExtractorAttrs } from '../constants/types';

type UnionTypeExtractorAttrs = TypeExtractorAttrs & {
  unionSpecifier: ASTCUnionSpecifier;
};

/**
 * Walks over struct specifier tree and creates struct type
 */
export function extractUnionTypeFromNode({
  context,
  unionSpecifier,
  extractSpecifierType,
  extractNamedEntryFromDeclarator,
}: UnionTypeExtractorAttrs): CUnionType {
  let unionType = CUnionType.ofBlank(context.config.arch, unionSpecifier.name?.text);

  // handle const int x, y;
  unionSpecifier.list?.children.forEach(declaration => {
    const type = extractSpecifierType({
      specifier: declaration.specifierList,
      context,
    });

    if (!type) {
      throw new CTypeCheckError(CTypeCheckErrorCode.UNABLE_TO_EXTRACT_STRUCT_TYPE);
    }

    // define x, y as separate fields and calculate offsets
    declaration.declaratorList.children.forEach(structDeclarator => {
      const entry = extractNamedEntryFromDeclarator({
        declarator: structDeclarator.declarator,
        context,
        type,
      });

      unionType = pipe(unionType.ofAppendedField(entry), unwrapEitherOrThrow);
    });
  });

  return unionType;
}
