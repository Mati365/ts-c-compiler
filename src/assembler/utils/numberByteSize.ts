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

  return Math.floor(Math.log2(num) / 8) + 1;
}

/**
 * Find next power of two
 *
 * @export
 * @param {number} num
 * @returns {number}
 */
export function roundToPowerOfTwo(num: number): number {
  if (num === 1)
    return 1;

  return (
    Math.ceil(Math.log(num) / Math.log(2)) ** 2
  );
}
