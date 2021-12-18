import * as R from 'ramda';

import {concatNonEmptyStrings, hasFlag} from '@compiler/core/utils';

import {SIZEOF_PRIMITIVE_TYPE} from '@compiler/x86-nano-c/arch';
import {Result, err, ok} from '@compiler/core/monads';
import {
  CCompilerArch,
  CTypeQualifier,
  CTypeSpecifier,
} from '@compiler/x86-nano-c/constants';

import {CTypeCheckError, CTypeCheckErrorCode} from '../errors/CTypeCheckError';
import {CType} from './CType';
import {CSpecBitmap} from '../constants';

import {
  bitsetToKeywords,
  parseKeywordsToBitset,
} from '../utils';

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
  specifiers: number,
};

export type CPrimitiveTypeSourceParserAttrs = {
  arch: CCompilerArch,
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
  static readonly int = CPrimitiveType.ofSpecifiers(CSpecBitmap.int);
  static readonly float = CPrimitiveType.ofSpecifiers(CSpecBitmap.float);
  static readonly double = CPrimitiveType.ofSpecifiers(CSpecBitmap.double);
  static readonly short = CPrimitiveType.ofSpecifiers(CSpecBitmap.short);
  static readonly char = CPrimitiveType.ofSpecifiers(CSpecBitmap.char);
  static readonly bool = CPrimitiveType.ofSpecifiers(CSpecBitmap._Bool);
  static readonly void = CPrimitiveType.ofSpecifiers(CSpecBitmap.void);

  get specifiers() {
    return this.value.specifiers;
  }

  getByteSize(arch: CCompilerArch): number {
    return CPrimitiveType.sizeOf(arch, this.specifiers);
  }

  getDisplayName() {
    const {specifiers} = this;

    return concatNonEmptyStrings(
      [
        this.getQualifiersDisplayName(),
        ...bitsetToKeywords(CSpecBitmap, specifiers),
      ],
    );
  }

  hasSpecifierType(types: number): boolean {
    return hasFlag(types, this.specifiers);
  }

  isVoid() {
    return this.hasSpecifierType(CSpecBitmap.void);
  }

  isSigned() {
    return !this.hasSpecifierType(CSpecBitmap.signed);
  }

  isUnsigned() {
    return !this.isSigned();
  }

  /**
   * Returns sizeof from specifiers of primitive type
   *
   * @static
   * @param {CCompilerArch} arch
   * @param {number} specifiers
   * @return {number}
   * @memberof CPrimitiveType
   */
  static sizeOf(arch: CCompilerArch, specifiers: number): number {
    return SIZEOF_PRIMITIVE_TYPE[arch](specifiers);
  }

  /**
   * Perform check if type has correctly set specifiers.
   *
   * @example
   *  unsigned void => it should throw error
   *  int => it is fine
   *
   * @static
   * @param {CCompilerArch} arch
   * @param {CPrimitiveType} type
   * @return {Result<CPrimitiveType, CTypeCheckError>}
   * @memberof CPrimitiveType
   */
  static validate(arch: CCompilerArch, type: CPrimitiveType): Result<CPrimitiveType, CTypeCheckError> {
    const byteSize = type.getByteSize(arch);
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
   * Init of type based of only bitflags
   *
   * @static
   * @param {number} specifiers
   * @param {number} [qualifiers=0]
   * @return {CPrimitiveType}
   * @memberof CPrimitiveType
   */
  static ofSpecifiers(specifiers: number, qualifiers: number = 0): CPrimitiveType {
    return new CPrimitiveType(
      {
        qualifiers,
        specifiers,
      },
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
      const qualifiersResult = CType.qualifiersToBitset(attrs.qualifiers);

      if (qualifiersResult.isErr())
        return err(qualifiersResult.unwrapErr());

      return this.validate(
        attrs.arch,
        new CPrimitiveType(
          {
            qualifiers: qualifiersResult.unwrap(),
            specifiers,
          },
        ),
      );
    });
  }
}
