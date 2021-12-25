import * as R from 'ramda';

import {ASTCDeclarationSpecifier} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CTypeQualifier} from '@compiler/x86-nano-c/constants';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';
import {CType, CPrimitiveType} from '../types';
import {TypeCheckerContext} from '../TypeCheckerContext';

type DeclarationSpecifierExtractorAttrs = {
  context: TypeCheckerContext,
  specifier: ASTCDeclarationSpecifier,
};

/**
 * Extract type from ParameterDeclarationSpecifier
 *
 * @todo
 *  - Add structs and enums
 *
 * @export
 * @param {DeclarationExtractorAttrs} attrs
 * @return {CType}
 */
export function extractTypeFromDeclarationSpecifier(
  {
    context,
    specifier,
  }: DeclarationSpecifierExtractorAttrs,
): CType {
  if (!specifier)
    return null;

  const {typeQualifiers, typeSpecifiers} = specifier;

  const qualifiers: CTypeQualifier[] = typeQualifiers?.items;
  const {primitives, structs, enums} = typeSpecifiers?.getGroupedSpecifiers();
  const [hasPrimitives, hasStructs, hasEnums] = [
    !R.isEmpty(primitives),
    !R.isEmpty(structs),
    !R.isEmpty(enums),
  ];

  if ((+hasPrimitives + +hasStructs + +hasEnums) > 1 || structs.length > 1 || enums.length > 1)
    throw new CTypeCheckError(CTypeCheckErrorCode.INCORRECT_TYPE_SPECIFIERS);

  if (hasEnums || hasStructs) {
    let typeName: string = null;
    if (hasStructs)
      typeName = structs[0].structOrUnionSpecifier.name.text;
    else
      typeName = enums[0].enumSpecifier.name.text;

    const type = context.scope.findType(typeName);
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

  return null;
}
