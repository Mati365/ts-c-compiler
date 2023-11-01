import * as R from 'ramda';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import { getCompilerArchDescriptor } from 'arch';

import {
  concatNonEmptyStrings,
  hasFlag,
  numberByteSize,
} from '@ts-c-compiler/core';

import { CCompilerArch, CTypeQualifier, CTypeSpecifier } from '#constants';

import {
  CTypeCheckError,
  CTypeCheckErrorCode,
} from '../errors/CTypeCheckError';

import { CType, CTypeDescriptor } from './CType';
import {
  CSpecBitmap,
  CCOMPILER_INTEGRAL_SPEC_BITMAP,
  CCOMPILER_FLOATING_SPEC_BITMAP,
} from '../constants';

import { bitsetToKeywords, parseKeywordsToBitset } from '../utils';

export type CPrimitiveTypeDescriptor = CTypeDescriptor & {
  specifiers: number;
};

export type CPrimitiveTypeSourceParserAttrs = {
  arch: CCompilerArch;
  qualifiers?: CTypeQualifier[];
  specifiers?: CTypeSpecifier[];
};

export function isPrimitiveLikeType(
  type: CType,
  strict: boolean = false,
): type is CPrimitiveType {
  return type?.isPrimitive() && (!strict || 'isUnsigned' in type);
}

/**
 * Returns basic C type such as void / int / short
 */
export class CPrimitiveType extends CType<CPrimitiveTypeDescriptor> {
  static typeGenerator =
    (specifier: number, qualifiers?: number) => (arch: CCompilerArch) =>
      CPrimitiveType.ofSpecifiers(arch, specifier, qualifiers);

  static address = CPrimitiveType.typeGenerator(CSpecBitmap.int);
  static int = CPrimitiveType.typeGenerator(CSpecBitmap.int);
  static float = CPrimitiveType.typeGenerator(CSpecBitmap.float);
  static double = CPrimitiveType.typeGenerator(CSpecBitmap.double);
  static short = CPrimitiveType.typeGenerator(CSpecBitmap.short);
  static char = CPrimitiveType.typeGenerator(CSpecBitmap.char);
  static void = CPrimitiveType.typeGenerator(CSpecBitmap.void);
  static bool = CPrimitiveType.typeGenerator(CSpecBitmap._Bool);

  get specifiers() {
    return this.value.specifiers;
  }

  override getByteSize(): number {
    return CPrimitiveType.sizeOf(this.arch, this.specifiers);
  }

  override getDisplayName() {
    const { specifiers } = this;

    return concatNonEmptyStrings([
      this.getQualifiersDisplayName(),
      ...bitsetToKeywords(CSpecBitmap, specifiers),
    ]);
  }

  hasSpecifierType(types: number): boolean {
    return hasFlag(types, this.specifiers);
  }

  override isScalar() {
    return true;
  }

  override isPrimitive() {
    return true;
  }

  override isVoid() {
    return this.hasSpecifierType(CSpecBitmap.void);
  }

  isSigned() {
    return !this.hasSpecifierType(CSpecBitmap.unsigned);
  }

  isUnsigned() {
    return !this.isSigned() && !this.isFloating();
  }

  isIntegral() {
    return (this.specifiers & CCOMPILER_INTEGRAL_SPEC_BITMAP) !== 0;
  }

  isFloating() {
    return (this.specifiers & CCOMPILER_FLOATING_SPEC_BITMAP) !== 0;
  }

  override canBeStoredInIntegralReg() {
    return this.isIntegral() && super.canBeStoredInIntegralReg();
  }

  override canBeStoredInFloatReg() {
    return this.isFloating() && super.canBeStoredInFloatReg();
  }

  /**
   * Returns value type based on provided value
   */
  static typeofValue(arch: CCompilerArch, value: any): CPrimitiveType {
    // BOOLEAN
    if (R.is(Boolean, value)) {
      return CPrimitiveType.bool(arch);
    }

    // CHAR
    if (R.is(String, value)) {
      if (value.length === 1) {
        return CPrimitiveType.char(arch);
      }

      return null;
    }

    // INT / CHAR
    if (Number.isInteger(value)) {
      const charType = CPrimitiveType.char(arch);
      const byteSize = numberByteSize(value);

      if (charType.getByteSize() === byteSize) {
        return charType;
      }

      const intType = CPrimitiveType.int(arch);
      if (intType.getByteSize() < byteSize) {
        return null;
      }

      return intType;
    }

    // FLOAT
    if (Number.isFinite(value)) {
      return CPrimitiveType.float(arch);
    }

    return null;
  }

  /**
   * Returns sizeof from specifiers of primitive type
   */
  static sizeOf(arch: CCompilerArch, specifiers: number): number {
    return getCompilerArchDescriptor(arch).sizeofPrimitiveType(specifiers);
  }

  /**
   * Perform check if type has correctly set specifiers.
   *
   * @example
   *  unsigned void => it should throw error
   *  int => it is fine
   */
  static validate(
    type: CPrimitiveType,
  ): E.Either<CTypeCheckError, CPrimitiveType> {
    const byteSize = type.getByteSize();
    if (!R.isNil(byteSize)) {
      return E.right(type);
    }

    if (type.isVoid()) {
      if (type.specifiers !== CSpecBitmap.void || type.qualifiers) {
        return E.left(
          new CTypeCheckError(CTypeCheckErrorCode.INCORRECT_VOID_SPECIFIERS),
        );
      }

      return E.right(type);
    }

    return E.left(
      new CTypeCheckError(CTypeCheckErrorCode.INCORRECT_TYPE_SPECIFIERS),
    );
  }

  /**
   * Init of type based of only bitflags
   */
  static ofSpecifiers(
    arch: CCompilerArch,
    specifiers: number,
    qualifiers: number = 0,
  ): CPrimitiveType {
    return new CPrimitiveType({
      arch,
      qualifiers,
      specifiers,
    });
  }

  /**
   * Creates primitive type from list of strings returned from parser
   */
  static ofParserSource(
    attrs: CPrimitiveTypeSourceParserAttrs,
  ): E.Either<CTypeCheckError, CPrimitiveType> {
    const specifiersResult = parseKeywordsToBitset({
      errorCode: CTypeCheckErrorCode.UNKNOWN_SPECIFIERS_KEYWORD,
      bitmap: CSpecBitmap,
      keywords: attrs.specifiers,
    });

    return pipe(
      specifiersResult,
      E.chainW(specifiers => {
        const qualifiersResult = CType.qualifiersToBitset(attrs.qualifiers);

        if (E.isLeft(qualifiersResult)) {
          return qualifiersResult;
        }

        return this.validate(
          new CPrimitiveType({
            arch: attrs.arch,
            qualifiers: qualifiersResult.right,
            specifiers,
          }),
        );
      }),
    );
  }
}
