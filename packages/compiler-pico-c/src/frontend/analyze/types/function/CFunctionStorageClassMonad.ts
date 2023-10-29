import { hasFlag } from '@ts-c-compiler/core';

import { Identity, Result, ok } from '@ts-c-compiler/core';
import { IsPrintable } from '@ts-c-compiler/core';

import { CStorageClassSpecifier } from '#constants';
import {
  CTypeCheckError,
  CTypeCheckErrorCode,
} from '../../errors/CTypeCheckError';
import { CStorageSpecBitmap } from '../../constants/bitmaps';
import { bitsetToKeywords, parseKeywordsToBitset } from '../../utils';

export type CStorageClassTypeDescriptor = {
  specifiers: number;
};

/**
 * Box that contains function inline / no-return flags
 */
export class CStorageClassMonad
  extends Identity<CStorageClassTypeDescriptor>
  implements IsPrintable
{
  get specifiers() {
    return this.value.specifiers;
  }

  isBlank() {
    return !this.specifiers;
  }

  isTypedef() {
    return hasFlag(CStorageSpecBitmap.typedef, this.specifiers);
  }

  isExtern() {
    return hasFlag(CStorageSpecBitmap.extern, this.specifiers);
  }

  isStatic() {
    return hasFlag(CStorageSpecBitmap.static, this.specifiers);
  }

  isAuto() {
    return hasFlag(CStorageSpecBitmap.auto, this.specifiers);
  }

  isRegister() {
    return hasFlag(CStorageSpecBitmap.register, this.specifiers);
  }

  getDisplayName(): string {
    return bitsetToKeywords(CStorageSpecBitmap, this.specifiers).join(' ');
  }

  /**
   * Creates empty object instance
   */
  static ofBlank(): CStorageClassMonad {
    return new CStorageClassMonad({
      specifiers: 0,
    });
  }

  /**
   * Creates new instance of object
   */
  static ofSpecifiers(specifiers: number): CStorageClassMonad {
    return new CStorageClassMonad({
      specifiers,
    });
  }

  /**
   * Parses enum list of specifiers into bitmap
   */
  static ofParserSource(
    specifiers: CStorageClassSpecifier[],
  ): Result<CStorageClassMonad, CTypeCheckError> {
    const specifiersResult = parseKeywordsToBitset({
      errorCode: CTypeCheckErrorCode.UNKNOWN_SPECIFIERS_KEYWORD,
      bitmap: CStorageSpecBitmap,
      keywords: specifiers,
    });

    return specifiersResult.andThen(parsedSpecifier =>
      ok(
        new CStorageClassMonad({
          specifiers: parsedSpecifier,
        }),
      ),
    );
  }
}
