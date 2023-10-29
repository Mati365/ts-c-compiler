import { BINARY_MASKS } from '@ts-c-compiler/core';
import type { X86BitsMode } from '../constants';

/**
 * Convert signed byte number to normal
 */
export const getSignedNumber = (
  num: number,
  bits: X86BitsMode = 0x1,
): number => {
  const sign = (num >> (0x8 * bits - 0x1)) & 0x1;
  if (sign) {
    num -= BINARY_MASKS[bits] + 0x1;
  }
  return num;
};
