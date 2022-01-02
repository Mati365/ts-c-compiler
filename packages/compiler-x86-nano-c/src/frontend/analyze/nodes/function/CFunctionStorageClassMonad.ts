import {hasFlag} from '@compiler/core/utils';

import {Identity, Result, ok} from '@compiler/core/monads';
import {IsPrintable} from '@compiler/core/interfaces';

import {CStorageClassSpecifier} from '@compiler/x86-nano-c/constants';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';
import {CStorageSpecBitmap} from '../../constants/bitmaps';
import {bitsetToKeywords, parseKeywordsToBitset} from '../../utils';

export type CStorageClassTypeDescriptor = {
  specifiers: number,
};

/**
 * Box that contains function inline / noreturn flags
 *
 * @export
 * @class CStorageClassMonad
 * @extends {Identity<CStorageClassTypeDescriptor>}
 * @implements {IsPrintable}
 */
export class CStorageClassMonad
  extends Identity<CStorageClassTypeDescriptor>
  implements IsPrintable {

  get specifiers() { return this.value.specifiers; }

  isBlank() { return !this.specifiers; }
  isTypedef() { return hasFlag(CStorageSpecBitmap.typedef, this.specifiers); }
  isExtern() { return hasFlag(CStorageSpecBitmap.extern, this.specifiers); }
  isStatic() { return hasFlag(CStorageSpecBitmap.static, this.specifiers); }
  isAuto() { return hasFlag(CStorageSpecBitmap.auto, this.specifiers); }
  isRegister() { return hasFlag(CStorageSpecBitmap.register, this.specifiers); }

  getDisplayName(): string {
    return bitsetToKeywords(CStorageSpecBitmap, this.specifiers).join(' ');
  }

  /**
   * Creates empty object instance
   *
   * @static
   * @return {CStorageClassMonad}
   * @memberof CStorageClassMonad
   */
  static ofBlank(): CStorageClassMonad {
    return new CStorageClassMonad(
      {
        specifiers: 0,
      },
    );
  }

  /**
   * Creates new instance of object
   *
   * @static
   * @param {number} specifiers
   * @return {CStorageClassMonad}
   * @memberof CStorageClassMonad
   */
  static ofSpecifiers(specifiers: number): CStorageClassMonad {
    return new CStorageClassMonad(
      {
        specifiers,
      },
    );
  }

  /**
   * Parses enum list of specifiers into bitmap
   *
   * @static
   * @param {CFunctionSpecifier[]} specifiers
   * @return {Result<CStorageClassMonad, CTypeCheckError>}
   * @memberof CStorageClassMonad
   */
  static ofParserSource(specifiers: CStorageClassSpecifier[]): Result<CStorageClassMonad, CTypeCheckError> {
    const specifiersResult = parseKeywordsToBitset(
      {
        errorCode: CTypeCheckErrorCode.UNKNOWN_SPECIFIERS_KEYWORD,
        bitmap: CStorageSpecBitmap,
        keywords: specifiers,
      },
    );

    return specifiersResult.andThen((parsedSpecifier) => ok(
      new CStorageClassMonad(
        {
          specifiers: parsedSpecifier,
        },
      ),
    ));
  }
}
