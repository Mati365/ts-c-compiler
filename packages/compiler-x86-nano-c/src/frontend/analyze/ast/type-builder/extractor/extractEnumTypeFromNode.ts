import {ASTCEnumSpecifier} from '@compiler/x86-nano-c/frontend/parser';
import {CEnumType, CPrimitiveType} from '../../../types';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../../errors/CTypeCheckError';
import {TypeExtractorAttrs} from '../constants/types';

import {evalConstantMathExpression} from '../../eval';

type EnumTypeExtractorAttrs = TypeExtractorAttrs & {
  enumSpecifier: ASTCEnumSpecifier,
};

/**
 * Walks over enum tree node and constructs enum type
 *
 * @export
 * @param {EnumTypeExtractorAttrs} attrs
 * @return {CEnumType}
 */
export function extractEnumTypeFromNode(
  {
    enumSpecifier,
    context,
  }: EnumTypeExtractorAttrs): CEnumType {
  const {arch} = context.config;

  const blankEnum = CEnumType.ofBlank(arch, enumSpecifier.name.text);
  const expectedResultType = blankEnum.getEntryValueType();

  let prevEnumEntryValue = null;

  return enumSpecifier.enumerations.reduce((acc, enumeration) => {
    prevEnumEntryValue = prevEnumEntryValue ?? 0;

    if (enumeration.expression) {
      const exprResult = evalConstantMathExpression(
        {
          expression: enumeration.expression,
          context,
        },
      ).unwrapOrThrow();

      const resultType = CPrimitiveType.typeofValue(arch, exprResult);
      if (!expectedResultType.isEqual(resultType)) {
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

    return (
      acc
        .ofAppendedField(enumeration.name.text, prevEnumEntryValue++)
        .unwrapOrThrow()
    );
  }, blankEnum);
}
