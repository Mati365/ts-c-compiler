import * as R from 'ramda';

import {ASTCDeclarationSpecifier} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CTypeQualifier} from '@compiler/x86-nano-c/constants';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';
import {CType, CPrimitiveType} from '../../types';
import {TypeCheckerContext} from '../TypeCheckerContext';

/**
 * Extract type from ParameterDeclarationSpecifier
 *
 * @todo
 *  - Add structs and enums
 *
 * @export
 * @param {TypeCheckerContext} context
 * @param {ASTCDeclarationSpecifier} declaration
 * @return {CType}
 */
export function extractTypeFromDeclarationSpecifier(
  context: TypeCheckerContext,
  declaration: ASTCDeclarationSpecifier,
): CType {
  if (!declaration)
    return null;

  const {typeQualifiers, typeSpecifiers} = declaration;

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
    throw new Error('TODO');
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
