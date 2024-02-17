import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import { hasFlag } from '@ts-cc/core';
import { Identity } from '@ts-cc/core';
import { IsPrintable } from '@ts-cc/core';

import { CFunctionSpecifier } from '#constants';
import { CTypeCheckError, CTypeCheckErrorCode } from '../../errors/CTypeCheckError';

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
  ): E.Either<CTypeCheckError, CFunctionSpecifierMonad> {
    return pipe(
      parseKeywordsToBitset({
        errorCode: CTypeCheckErrorCode.UNKNOWN_SPECIFIERS_KEYWORD,
        bitmap: CFuncSpecBitmap,
        keywords: specifiers,
      }),
      E.map(
        parsedSpecifier =>
          new CFunctionSpecifierMonad({
            specifiers: parsedSpecifier,
          }),
      ),
    );
  }
}
