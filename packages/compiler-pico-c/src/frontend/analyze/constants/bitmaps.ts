import {
  CTypeSpecifier,
  CTypeQualifier,
  CFunctionSpecifier,
  CStorageClassSpecifier,
  CCOMPILER_INTEGRAL_SPECIFIERS,
  CCOMPILER_FLOATING_SPECIFIERS,
} from '@compiler/pico-c/constants/lang';

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

export const CFuncSpecBitmap: Record<CFunctionSpecifier, number> = {
  [CFunctionSpecifier.INLINE]: 1,
  [CFunctionSpecifier.NORETURN]: 1 << 1,
};

export const CStorageSpecBitmap: Record<CStorageClassSpecifier, number> = {
  [CStorageClassSpecifier.TYPEDEF]: 1,
  [CStorageClassSpecifier.EXTERN]: 1 << 1,
  [CStorageClassSpecifier.STATIC]: 1 << 2,
  [CStorageClassSpecifier.AUTO]: 1 << 3,
  [CStorageClassSpecifier.REGISTER]: 1 << 4,
};

export const CCOMPILER_INTEGRAL_SPEC_BITMAP: number =
  CCOMPILER_INTEGRAL_SPECIFIERS.reduce(
    (acc, item) => acc | CSpecBitmap[item],
    0,
  );

export const CCOMPILER_FLOATING_SPEC_BITMAP: number =
  CCOMPILER_FLOATING_SPECIFIERS.reduce(
    (acc, item) => acc | CSpecBitmap[item],
    0,
  );
