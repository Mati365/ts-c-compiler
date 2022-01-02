import {Identity, Result, ok} from '@compiler/core/monads';
import {hasFlag} from '@compiler/core/utils';

import {CFunctionSpecifier} from '@compiler/x86-nano-c/constants';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';
import {CFuncSpecBitmap} from '../../constants/bitmaps';

import {IsPrintable} from '@compiler/core/interfaces';
import {bitsetToKeywords, parseKeywordsToBitset} from '../../utils';

export type CFunctionSpecifierTypeDescriptor = {
  specifiers: number,
};

/**
 * Box that contains function inline / noreturn flags
 *
 * @export
 * @class CFunctionSpecifierMonad
 * @extends {Identity<CFunctionSpecifierTypeDescriptor>}
 * @implements {IsPrintable}
 */
export class CFunctionSpecifierMonad
  extends Identity<CFunctionSpecifierTypeDescriptor>
  implements IsPrintable {

  get specifiers() { return this.value.specifiers; }

  isBlank() { return !this.specifiers; }
  isInline() { return hasFlag(CFuncSpecBitmap.inline, this.specifiers); }
  isNoReturn() { return hasFlag(CFuncSpecBitmap.noreturn, this.specifiers); }

  getDisplayName(): string {
    return bitsetToKeywords(CFuncSpecBitmap, this.specifiers).join(' ');
  }

  /**
   * Creates empty object instance
   *
   * @static
   * @return {CFunctionSpecifierMonad}
   * @memberof CFunctionSpecifierMonad
   */
  static ofBlank(): CFunctionSpecifierMonad {
    return new CFunctionSpecifierMonad(
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
   * @return {CFunctionSpecifierMonad}
   * @memberof CFunctionSpecifierMonad
   */
  static ofSpecifiers(specifiers: number): CFunctionSpecifierMonad {
    return new CFunctionSpecifierMonad(
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
   * @return {Result<CFunctionSpecifierMonad, CTypeCheckError>}
   * @memberof CFunctionSpecifierMonad
   */
  static ofParserSource(specifiers: CFunctionSpecifier[]): Result<CFunctionSpecifierMonad, CTypeCheckError> {
    const specifiersResult = parseKeywordsToBitset(
      {
        errorCode: CTypeCheckErrorCode.UNKNOWN_SPECIFIERS_KEYWORD,
        bitmap: CFuncSpecBitmap,
        keywords: specifiers,
      },
    );

    return specifiersResult.andThen((parsedSpecifier) => ok(
      new CFunctionSpecifierMonad(
        {
          specifiers: parsedSpecifier,
        },
      ),
    ));
  }
}
