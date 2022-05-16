import {ASTCStructSpecifier} from '@compiler/pico-c/frontend/parser';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../../errors/CTypeCheckError';
import {CStructType} from '../../../types';
import {TypeExtractorAttrs} from '../constants/types';

import {evalConstantExpression} from '../../expression-analyze';

type StructTypeExtractorAttrs = TypeExtractorAttrs & {
  structSpecifier: ASTCStructSpecifier,
};

/**
 * Walks over struct specifier tree and creates struct type
 *
 * @export
 * @param {StructTypeExtractorAttrs} attrs
 * @return {CStructType}
 */
export function extractStructTypeFromNode(
  {
    context,
    structSpecifier,
    extractSpecifierType,
    extractNamedEntryFromDeclarator,
  }: StructTypeExtractorAttrs,
): CStructType {
  let structType = CStructType.ofBlank(context.config.arch, structSpecifier.name?.text);

  // handle const int x, y;
  structSpecifier.list?.children.forEach((declaration) => {
    const type = extractSpecifierType(
      {
        specifier: declaration.specifierList,
        context,
      },
    );

    if (!type)
      throw new CTypeCheckError(CTypeCheckErrorCode.UNABLE_TO_EXTRACT_STRUCT_TYPE);

    // define x, y as separate fields and calculate offsets
    declaration.declaratorList.children.forEach((structDeclarator) => {
      const entry = extractNamedEntryFromDeclarator(
        {
          declarator: structDeclarator.declarator,
          context,
          type,
        },
      );

      const bitset = +evalConstantExpression(
        {
          expression: structDeclarator.expression,
          context,
        },
      ).unwrapOrThrow();

      structType = (
        structType
          .ofAppendedField(entry, bitset)
          .unwrapOrThrow()
      );
    });
  });

  return structType;
}
