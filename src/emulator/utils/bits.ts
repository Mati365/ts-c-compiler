/**
 * Sets nth bit in value to num(0, 1)
 *
 * @export
 * @param {number} nth
 * @param {number} value
 * @param {number} num
 * @returns {number}
 */
export function setBit(nth: number, value: number|boolean, num: number): number {
  return (
    value
      ? (num | (1 << nth))
      : (num & ~(1 << nth))
  );
}

/**
 * Flips nth bit in value, 0 -> 1, 1 -> 0
 *
 * @export
 * @param {number} nth
 * @param {number} num
 * @returns {number}
 */
export function toggleBit(nth: number, value: number): number {
  return value ^ (1 << nth);
}

/**
 * Returns nth bit from value, 0 or 1
 *
 * @export
 * @param {number} nth
 * @param {number} value
 * @returns {number}
 */
export function getBit(nth: number, value: number): number {
  return (value >> nth) & 0x1;
}

/**
 * Remove whole flag from value, sets 0
 *
 * @export
 * @param {number} flag
 * @param {number} value
 * @returns {number}
 */
export function removeFlag(flag: number, value: number): number {
  return value & (~flag);
}

/**
 * Checks if nth bit is set in value
 *
 * @export
 * @param {number} nth
 * @param {number} value
 * @returns {boolean}
 */
export function isSetBit(nth: number, value: number): boolean {
  return getBit(nth, value) === 1;
}

/**
 * Checks if bitmask flag is in value
 *
 * @export
 * @param {number} flag
 * @param {number} value
 * @returns {boolean}
 */
export function hasFlag(flag: number, value: number): boolean {
  return (value & flag) === flag;
}
