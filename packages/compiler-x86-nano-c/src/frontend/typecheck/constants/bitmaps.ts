import {CTypeSpecifier, CTypeQualifier} from '@compiler/x86-nano-c/constants/lang';

export const CSpecBitmap: Record<CTypeSpecifier, number> = {
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

export const CQualBitmap: Record<CTypeQualifier, number> = {
  [CTypeQualifier.CONST]: 1,
  [CTypeQualifier.ATOMIC]: 1 << 1,
  [CTypeQualifier.RESTRICT]: 1 << 2,
  [CTypeQualifier.VOLATILE]: 1 << 3,
};
