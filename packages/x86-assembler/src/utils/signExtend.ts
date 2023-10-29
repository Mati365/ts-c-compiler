import { BINARY_MASKS, getMSbit } from '@ts-c-compiler/core';
import type { X86BitsMode } from '../constants';

export const signExtend = (
  num: number,
  bits: X86BitsMode,
  targetBits: X86BitsMode,
): number => {
  if (targetBits <= bits) {
    return num;
  }

  const msbit = getMSbit(num, bits);
  const mask = msbit ? 0xff : 0x0;
  let output = num & BINARY_MASKS[bits];

  for (let i = bits; i < targetBits; ++i) {
    output |= mask << (i * 8);
  }

  return output;
};
