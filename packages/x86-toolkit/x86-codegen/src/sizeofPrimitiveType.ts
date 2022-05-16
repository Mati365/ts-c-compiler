import {CSpecBitmap} from '@compiler/pico-c/frontend/analyze/constants/bitmaps';
import {SizeofPrimitiveTypeFn} from '@compiler/pico-c/arch/utils';

export const sizeofPrimitiveType: SizeofPrimitiveTypeFn = (specifiers) => {
  switch (specifiers) {
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

    case CSpecBitmap.float:
    case CSpecBitmap.double:
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
};
