/**
 * Get number size in bytes
 *
 * @export
 * @param {number} num
 * @returns {number}
 */
export function numberByteSize(num: number): number {
  if (!num)
    return 1;

  if (num < 0)
    num = (-num) * 2;

  return Math.floor(Math.log2(num) / 8) + 1;
}

/**
 * Size of bytes to encode signed number
 *
 * @export
 * @param {number} num
 * @returns {number}
 */
export function signedNumberByteSize(num: number): number {
  return numberByteSize(Math.abs(num) << 1);
}

/**
 * Find next power of two
 *
 * @export
 * @param {number} num
 * @returns {number}
 */
export function roundToPowerOfTwo(num: number): number {
  if (num <= 1)
    return 1;

  let power = 2;
  num--;

  // eslint-disable-next-line no-cond-assign
  while (num >>= 1)
    power <<= 1;

  return power;
}

/**
 * Returns size in bytes number rounded to power of two
 *
 * @export
 * @param {number} num
 * @returns {number}
 */
export function roundedSignedNumberByteSize(num: number): number {
  return roundToPowerOfTwo(signedNumberByteSize(num));
}

/**
 * Fast count bits in number
 *
 * @export
 * @param {number} num
 * @returns
 */
export function bitsCount(num: number) {
  if (!num)
    return 1;

  return Math.floor(Math.log2(num)) + 1;
}
