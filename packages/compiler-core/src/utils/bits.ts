/**
 * Sets nth bit in value to num(0, 1)
 */
export function setBit(nth: number, value: number | boolean, num: number): number {
  return value ? num | (1 << nth) : num & ~(1 << nth);
}

export function condFlag(cond: boolean, flag: number) {
  return cond ? flag : 0;
}

/**
 * Flips nth bit in value, 0 -> 1, 1 -> 0
 */
export function toggleBit(nth: number, value: number): number {
  return value ^ (1 << nth);
}

/**
 * Returns nth bit from value, 0 or 1
 */
export function getBit(nth: number, value: number): number {
  return (value >> nth) & 0x1;
}

/**
 * Remove whole flag from value, sets 0
 */
export function removeFlag(flag: number, value: number): number {
  return value & ~flag;
}

/**
 * Checks if nth bit is set in value
 */
export function isSetBit(nth: number, value: number): boolean {
  return getBit(nth, value) === 1;
}

/**
 * Checks if bitmask flag is in value
 */
export function hasFlag(flag: number, value: number): boolean {
  return (value & flag) === flag;
}

/**
 * Get most significant bit
 */
export function getMSbit(num: number, byte: number = 0x1): number {
  return (num >> (byte * 0x8 - 0x1)) & 0x1;
}

/**
 * Get bit next to most significant bit
 */
export function getSMSbit(num: number, byte: number = 0x1): number {
  return (num >> (byte * 0x8 - 0x1 - 1)) & 0x1;
}

/**
 * Flips bytes horizontally in byte, much faster than reverseBits
 */
export function reverseByte(byte: number): number {
  let retVal: number = 0x0;

  if (byte & 0x01) {
    retVal |= 0x80;
  }

  if (byte & 0x02) {
    retVal |= 0x40;
  }

  if (byte & 0x04) {
    retVal |= 0x20;
  }

  if (byte & 0x08) {
    retVal |= 0x10;
  }

  if (byte & 0x10) {
    retVal |= 0x08;
  }

  if (byte & 0x20) {
    retVal |= 0x04;
  }

  if (byte & 0x40) {
    retVal |= 0x02;
  }

  if (byte & 0x80) {
    retVal |= 0x01;
  }

  return retVal;
}

/**
 * Count bits in 32 int
 *
 * @see {@url https://stackoverflow.com/a/43122214}
 */
export function countBits(n: number): number {
  n -= (n >> 1) & 0x55555555;
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
}
