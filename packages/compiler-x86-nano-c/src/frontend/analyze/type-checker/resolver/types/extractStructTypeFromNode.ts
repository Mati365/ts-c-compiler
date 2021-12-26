import {ASTCStructSpecifier} from '@compiler/x86-nano-c/frontend/parser';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../../errors/CTypeCheckError';
import {CStructType} from '../../types';
import {TypeExtractorAttrs} from '../constants/types';

import {evalConstantMathExpression} from '../../../eval';

type StructTypeExtractorAttrs = TypeExtractorAttrs & {
  structSpecifier: ASTCStructSpecifier,
};

export function extractStructTypeFromNode(
  {
    context,
    structSpecifier,
    resolveSpecifierType,
    extractNamedEntryFromDeclarator,
  }: StructTypeExtractorAttrs,
): CStructType {
  let structType = CStructType.ofBlank(context.config.arch, structSpecifier.name?.text);

  // handle const int x, y;
  structSpecifier.list?.children.forEach((declaration) => {
    const type = resolveSpecifierType(
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

      const bitset = evalConstantMathExpression(
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
