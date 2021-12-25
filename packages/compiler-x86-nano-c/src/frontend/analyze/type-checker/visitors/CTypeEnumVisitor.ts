import {ASTCEnumSpecifier} from '@compiler/x86-nano-c/frontend/parser';
import {CEnumType, CPrimitiveType} from '../types';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';
import {CTypeTreeVisitor} from './CTypeTreeVisitor';

import {evalConstantMathExpression} from '../../eval';

/**
 * Enters enum and analyzes its content
 *
 * @export
 * @class CTypeEnumVisitor
 * @extends {CTypeTreeVisitor}
 */
export class CTypeEnumVisitor extends CTypeTreeVisitor {
  initForRootNode(node: ASTCEnumSpecifier): this {
    const enumType = this.extractEnumTypeFromNode(node);
    if (enumType)
      this.scope.defineType(enumType.name, enumType);

    return this;
  }

  /**
   * Walks over enum tree node and constructs type
   *
   * @param {ASTCEnumSpecifier} enumSpecifier
   * @return {CEnumType}
   * @memberof CTypeStructVisitor
   */
  extractEnumTypeFromNode(enumSpecifier: ASTCEnumSpecifier): CEnumType {
    const {arch, context} = this;

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
            null,
            {
              expected: expectedResultType.getDisplayName(),
              received: resultType?.getDisplayName() ?? 'unknown',
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
}
