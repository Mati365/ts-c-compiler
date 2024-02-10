import { pipe } from 'fp-ts/function';
import { unwrapEitherOrThrow } from '@ts-c-compiler/core';

import { ASTCEnumSpecifier } from 'frontend/parser';
import { CEnumType, CPrimitiveType } from '../../../types';
import { CTypeCheckError, CTypeCheckErrorCode } from '../../../errors/CTypeCheckError';

import { TypeExtractorAttrs } from '../constants/types';

import { evalConstantExpression } from '../../expression-eval';
import { checkLeftTypeOverlapping } from '../../../checker';

type EnumTypeExtractorAttrs = TypeExtractorAttrs & {
  enumSpecifier: ASTCEnumSpecifier;
};

/**
 * Walks over enum tree node and constructs enum type
 */
export function extractEnumTypeFromNode({
  enumSpecifier,
  context,
}: EnumTypeExtractorAttrs): CEnumType {
  const { arch } = context.config;

  const blankEnum = CEnumType.ofBlank(arch, enumSpecifier.name?.text);
  const expectedResultType = blankEnum.getEntryValueType();

  let prevEnumEntryValue = null;

  return enumSpecifier.enumerations.reduce((acc, enumeration) => {
    prevEnumEntryValue = prevEnumEntryValue ?? 0;

    if (enumeration.expression) {
      const exprResult = pipe(
        evalConstantExpression({
          expression: enumeration.expression,
          context,
        }),
        unwrapEitherOrThrow,
      );

      const resultType = CPrimitiveType.typeofValue(arch, exprResult);

      if (!checkLeftTypeOverlapping(expectedResultType, resultType)) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.EXPECTED_RECEIVE_TYPE,
          enumeration.loc.start,
          {
            expected: expectedResultType.getShortestDisplayName(),
            received: resultType?.getShortestDisplayName() ?? 'unknown',
          },
        );
      }

      prevEnumEntryValue = exprResult;
    }

    return pipe(
      acc.ofAppendedField(enumeration.name.text, prevEnumEntryValue++),
      unwrapEitherOrThrow,
    );
  }, blankEnum);
}
