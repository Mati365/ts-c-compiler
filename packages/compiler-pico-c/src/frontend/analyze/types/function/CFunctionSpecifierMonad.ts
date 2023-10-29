import { hasFlag } from '@ts-c-compiler/core';

import { Identity, Result, ok } from '@ts-c-compiler/core';
import { CFunctionSpecifier } from '#constants';
import { IsPrintable } from '@ts-c-compiler/core';

import {
  CTypeCheckError,
  CTypeCheckErrorCode,
} from '../../errors/CTypeCheckError';
import { CFuncSpecBitmap } from '../../constants/bitmaps';
import { bitsetToKeywords, parseKeywordsToBitset } from '../../utils';

export type CFunctionSpecifierTypeDescriptor = {
  specifiers: number;
};

/**
 * Box that contains function inline / no-return flags
 */
export class CFunctionSpecifierMonad
  extends Identity<CFunctionSpecifierTypeDescriptor>
  implements IsPrintable
{
  get specifiers() {
    return this.value.specifiers;
  }

  isBlank() {
    return !this.specifiers;
  }

  isInline() {
    return hasFlag(CFuncSpecBitmap.inline, this.specifiers);
  }

  isNoReturn() {
    return hasFlag(CFuncSpecBitmap.noreturn, this.specifiers);
  }

  getDisplayName(): string {
    return bitsetToKeywords(CFuncSpecBitmap, this.specifiers).join(' ');
  }

  /**
   * Creates empty object instance
   */
  static ofBlank(): CFunctionSpecifierMonad {
    return new CFunctionSpecifierMonad({
      specifiers: 0,
    });
  }

  /**
   * Creates new instance of object
   */
  static ofSpecifiers(specifiers: number): CFunctionSpecifierMonad {
    return new CFunctionSpecifierMonad({
      specifiers,
    });
  }

  /**
   * Parses enum list of specifiers into bitmap
   */
  static ofParserSource(
    specifiers: CFunctionSpecifier[],
  ): Result<CFunctionSpecifierMonad, CTypeCheckError> {
    const specifiersResult = parseKeywordsToBitset({
      errorCode: CTypeCheckErrorCode.UNKNOWN_SPECIFIERS_KEYWORD,
      bitmap: CFuncSpecBitmap,
      keywords: specifiers,
    });

    return specifiersResult.andThen(parsedSpecifier =>
      ok(
        new CFunctionSpecifierMonad({
          specifiers: parsedSpecifier,
        }),
      ),
    );
  }
}
