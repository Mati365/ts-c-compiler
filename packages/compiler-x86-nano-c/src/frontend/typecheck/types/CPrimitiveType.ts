import * as R from 'ramda';

import {hasFlag} from '@compiler/core/utils';
import {Result, err, ok} from '@compiler/core/monads';
import {
  CTypeQualifier,
  CTypeSpecifier,
} from '@compiler/x86-nano-c/constants';

import {CTypeCheckError, CTypeCheckErrorCode} from '../errors/CTypeCheckError';
import {CType} from './CType';

import {
  bitsetToKeywords,
  parseKeywordsToBitset,
} from '../utils';

const CQualBitmap: Record<CTypeQualifier, number> = {
  [CTypeQualifier.CONST]: 1,
  [CTypeQualifier.ATOMIC]: 1 << 1,
  [CTypeQualifier.RESTRICT]: 1 << 2,
  [CTypeQualifier.VOLATILE]: 1 << 3,
};

const CSpecBitmap: Record<CTypeSpecifier, number> = {
  [CTypeSpecifier.SIGNED]: 1,
  [CTypeSpecifier.UNSIGNED]: 1 << 1,
  [CTypeSpecifier.LONG]: 1 << 2,
  [CTypeSpecifier.LONG_LONG]: 1 << 3,
  [CTypeSpecifier.SHORT]: 1 << 4,
  [CTypeSpecifier.FLOAT]: 1 << 5,
  [CTypeSpecifier.DOUBLE]: 1 << 6,
  [CTypeSpecifier.CHAR]: 1 << 7,
  [CTypeSpecifier.INT]: 1 << 8,
  [CTypeSpecifier.BOOL]: 1 << 9,
  [CTypeSpecifier.VOID]: 1 << 10,
};

export enum CSpecifierFlag {
  SIGNED = 1,
  UNSIGNED = 1 << 1,
  LONG = 1 << 2,
  LONG_LONG = 1 << 3,
  SHORT = 1 << 4,
  FLOAT = 1 << 5,
  DOUBLE = 1 << 6,
  CHAR = 1 << 7,
  INT = 1 << 8,
  BOOL = 1 << 9,
  VOID = 1 << 10,
}

export type CPrimitiveTypeDescriptor = {
  bitset: {
    qualifiers: number,
    specifiers: number,
  },
};

export type CPrimitiveTypeSourceParserAttrs = {
  qualifiers?: CTypeQualifier[],
  specifiers?: CTypeSpecifier[],
};

/**
 * Returns basic C type such as void / int / short
 *
 * @export
 * @class CPrimitiveType
 * @extends {CType<CPrimitiveTypeDescriptor>}
 */
export class CPrimitiveType extends CType<CPrimitiveTypeDescriptor> {
  get bitset() {
    return this.value.bitset;
  }

  get specifiers() {
    return this.bitset.specifiers;
  }

  get qualifiers() {
    return this.bitset.qualifiers;
  }

  getByteSize(): number {
    switch (this.specifiers) {
      case CSpecBitmap.char:
      case CSpecBitmap.signed | CSpecBitmap.char:
      case CSpecBitmap.unsigned | CSpecBitmap.char:
        return 1;

      case CSpecBitmap.short:
      case CSpecBitmap.short | CSpecBitmap.int:
      case CSpecBitmap.signed | CSpecBitmap.short:
      case CSpecBitmap.signed | CSpecBitmap.short | CSpecBitmap.int:
      case CSpecBitmap.unsigned | CSpecBitmap.short:
      case CSpecBitmap.unsigned | CSpecBitmap.short | CSpecBitmap.int:
      case CSpecBitmap.int:
      case CSpecBitmap.signed:
      case CSpecBitmap.signed | CSpecBitmap.int:
      case CSpecBitmap.unsigned:
      case CSpecBitmap.unsigned | CSpecBitmap.int:
        return 2;

      case CSpecBitmap.long:
      case CSpecBitmap.long | CSpecBitmap.int:
      case CSpecBitmap.signed | CSpecBitmap.long:
      case CSpecBitmap.signed | CSpecBitmap.long | CSpecBitmap.int:
      case CSpecBitmap.unsigned | CSpecBitmap.long:
      case CSpecBitmap.unsigned | CSpecBitmap.long | CSpecBitmap.int:
        return 4;

      default:
        return null;
    }
  }

  isVoid = () => this.hasSpecifierType(CSpecBitmap.void);
  isSigned = () => !this.hasSpecifierType(CSpecBitmap.signed);
  isUnsigned = () => !this.isSigned();

  hasSpecifierType(types: number): boolean {
    return hasFlag(types, this.specifiers);
  }

  getDisplayName() {
    const {specifiers, qualifiers} = this;

    return [
      ...bitsetToKeywords(CQualBitmap, qualifiers),
      ...bitsetToKeywords(CSpecBitmap, specifiers),
    ].join(' ');
  }

  /**
   * Perform check if type has correctly set specifiers.
   *
   * @example
   *  unsigned void => it should throw error
   *  int => it is fine
   *
   * @static
   * @param {CPrimitiveType} type
   * @return {Result<CPrimitiveType, CTypeCheckError>}
   * @memberof CPrimitiveType
   */
  static validate(type: CPrimitiveType): Result<CPrimitiveType, CTypeCheckError> {
    const byteSize = type.getByteSize();
    if (!R.isNil(byteSize))
      return ok(type);

    // check if type has additional specifiers to void that are not allowed
    if (type.isVoid() && type.specifiers !== CSpecBitmap.void) {
      return err(
        new CTypeCheckError(CTypeCheckErrorCode.INCORRECT_VOID_SPECIFIERS),
      );
    }

    return err(
      new CTypeCheckError(CTypeCheckErrorCode.INCORRECT_TYPE_SPECIFIERS),
    );
  }

  /**
   * Creates primitive type from list of strings returned from parser
   *
   * @static
   * @param {CPrimitiveTypeSourceParserAttrs} attrs
   * @return {Result<CPrimitiveType, CTypeCheckError>}
   * @memberof CPrimitiveType
   */
  static ofParserSource(attrs: CPrimitiveTypeSourceParserAttrs): Result<CPrimitiveType, CTypeCheckError> {
    const specifiersResult = parseKeywordsToBitset(
      {
        errorCode: CTypeCheckErrorCode.UNKNOWN_SPECIFIERS_KEYWORD,
        bitmap: CSpecBitmap,
        keywords: attrs.specifiers,
      },
    );

    return specifiersResult.andThen((specifiers) => {
      const qualifiersResult = parseKeywordsToBitset(
        {
          errorCode: CTypeCheckErrorCode.UNKNOWN_QUALIFIERS_KEYWORD,
          bitmap: CQualBitmap,
          keywords: attrs.qualifiers,
        },
      );

      if (qualifiersResult.isErr())
        return err(qualifiersResult.unwrapErr());

      return this.validate(
        new CPrimitiveType(
          {
            bitset: {
              qualifiers: qualifiersResult.unwrap(),
              specifiers,
            },
          },
        ),
      );
    });
  }
}
