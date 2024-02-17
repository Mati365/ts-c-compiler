import { pipe } from 'fp-ts/function';
import { unwrapEitherOrThrow } from '@ts-cc/core';

import { ASTCStructSpecifier } from 'frontend/parser';
import { CTypeCheckError, CTypeCheckErrorCode } from '../../../errors/CTypeCheckError';
import { CStructType } from '../../../types';
import { TypeExtractorAttrs } from '../constants/types';

import { evalConstantExpression } from '../../expression-eval';

type StructTypeExtractorAttrs = TypeExtractorAttrs & {
  structSpecifier: ASTCStructSpecifier;
};

/**
 * Walks over struct specifier tree and creates struct type
 */
export function extractStructTypeFromNode({
  context,
  structSpecifier,
  extractSpecifierType,
  extractNamedEntryFromDeclarator,
}: StructTypeExtractorAttrs): CStructType {
  let structType = CStructType.ofBlank(context.config.arch, structSpecifier.name?.text);

  // handle const int x, y;
  structSpecifier.list?.children.forEach(declaration => {
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

      const bitset = +pipe(
        evalConstantExpression({
          expression: structDeclarator.expression,
          context,
        }),
        unwrapEitherOrThrow,
      );

      structType = pipe(structType.ofAppendedField(entry, bitset), unwrapEitherOrThrow);
    });
  });

  return structType;
}
