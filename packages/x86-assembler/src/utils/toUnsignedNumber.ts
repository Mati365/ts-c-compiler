import { BINARY_MASKS } from '@ts-c-compiler/core';
import type { X86BitsMode } from '../constants';

/**
 * Convert signed byte number to unsigned
 */
export const toUnsignedNumber = (num: number, bits: X86BitsMode = 0x1): number => {
  const up = BINARY_MASKS[bits];
  if (num > up) {
    return num - up - 0x1;
  }

  if (num < 0x0) {
    return up + num + 0x1;
  }

  return num;
};
