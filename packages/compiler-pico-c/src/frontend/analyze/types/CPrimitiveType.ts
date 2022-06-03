import * as R from 'ramda';

import {SIZEOF_PRIMITIVE_TYPE} from '@compiler/pico-c/arch';

import {
  concatNonEmptyStrings,
  hasFlag,
  numberByteSize,
} from '@compiler/core/utils';

import {Result, err, ok} from '@compiler/core/monads';
import {
  CCompilerArch,
  CTypeQualifier,
  CTypeSpecifier,
} from '@compiler/pico-c/constants';

import {CTypeCheckError, CTypeCheckErrorCode} from '../errors/CTypeCheckError';
import {CType, CTypeDescriptor} from './CType';
import {CSpecBitmap, CCOMPILER_INTEGRAL_SPEC_BITMAP} from '../constants';

import {
  bitsetToKeywords,
  parseKeywordsToBitset,
} from '../utils';

export type CPrimitiveTypeDescriptor = CTypeDescriptor & {
  specifiers: number,
};

export type CPrimitiveTypeSourceParserAttrs = {
  arch: CCompilerArch,
  qualifiers?: CTypeQualifier[],
  specifiers?: CTypeSpecifier[],
};

export function isPrimitiveLikeType(type: CType): type is CPrimitiveType {
  return type?.isPrimitive();
}

/**
 * Returns basic C type such as void / int / short
 *
 * @export
 * @class CPrimitiveType
 * @extends {CType<CPrimitiveTypeDescriptor>}
 */
export class CPrimitiveType extends CType<CPrimitiveTypeDescriptor> {
  static typeGenerator = (specifier: number, qualifiers?: number) => (arch: CCompilerArch) => (
    CPrimitiveType.ofSpecifiers(arch, specifier, qualifiers)
  );

  static int = CPrimitiveType.typeGenerator(CSpecBitmap.int);
  static float = CPrimitiveType.typeGenerator(CSpecBitmap.float);
  static double = CPrimitiveType.typeGenerator(CSpecBitmap.double);
  static short = CPrimitiveType.typeGenerator(CSpecBitmap.short);
  static char = CPrimitiveType.typeGenerator(CSpecBitmap.char);
  static void = CPrimitiveType.typeGenerator(CSpecBitmap.void);
  static bool = CPrimitiveType.typeGenerator(CSpecBitmap._Bool);

  get specifiers() { return this.value.specifiers; }

  override getByteSize(): number {
    return CPrimitiveType.sizeOf(this.arch, this.specifiers);
  }

  override getDisplayName() {
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

  override isScalar() { return true; }
  override isPrimitive() { return true; }

  isVoid() { return this.hasSpecifierType(CSpecBitmap.void); }
  isSigned() { return !this.hasSpecifierType(CSpecBitmap.signed); }
  isUnsigned() { return !this.isSigned(); }
  isIntegral() {
    return (this.specifiers & CCOMPILER_INTEGRAL_SPEC_BITMAP) !== 0;
  }

  /**
   * Returns value type based on provided value
   *
   * @static
   * @param {CCompilerArch} arch
   * @param {*} value
   * @return {CPrimitiveType}
   * @memberof CPrimitiveType
   */
  static typeofValue(arch: CCompilerArch, value: any): CPrimitiveType {
    // BOOLEAN
    if (R.is(Boolean, value))
      return CPrimitiveType.bool(arch);

    // CHAR
    if (R.is(String, value)) {
      if (value.length === 1)
        return CPrimitiveType.char(arch);

      return null;
    }

    // INT
    if (Number.isInteger(value)) {
      const intType = CPrimitiveType.int(arch);
      if (intType.getByteSize() < numberByteSize(value))
        return null;

      return intType;
    }

    // FLOAT
    if (Number.isFinite(value))
      return CPrimitiveType.float(arch);

    return null;
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
   * @param {CPrimitiveType} type
   * @return {Result<CPrimitiveType, CTypeCheckError>}
   * @memberof CPrimitiveType
   */
  static validate(type: CPrimitiveType): Result<CPrimitiveType, CTypeCheckError> {
    const byteSize = type.getByteSize();
    if (!R.isNil(byteSize))
      return ok(type);

    if (type.isVoid()) {
      if (type.specifiers !== CSpecBitmap.void || type.qualifiers) {
        return err(
          new CTypeCheckError(CTypeCheckErrorCode.INCORRECT_VOID_SPECIFIERS),
        );
      }

      return ok(type);
    }

    return err(
      new CTypeCheckError(CTypeCheckErrorCode.INCORRECT_TYPE_SPECIFIERS),
    );
  }

  /**
   * Init of type based of only bitflags
   *
   * @static
   * @param {CCompilerArch} arch
   * @param {number} specifiers
   * @param {number} [qualifiers=0]
   * @return {CPrimitiveType}
   * @memberof CPrimitiveType
   */
  static ofSpecifiers(arch: CCompilerArch, specifiers: number, qualifiers: number = 0): CPrimitiveType {
    return new CPrimitiveType(
      {
        arch,
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
        new CPrimitiveType(
          {
            arch: attrs.arch,
            qualifiers: qualifiersResult.unwrap(),
            specifiers,
          },
        ),
      );
    });
  }
}
