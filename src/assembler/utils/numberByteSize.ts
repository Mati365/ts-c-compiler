/**
 * Get number size in bytes
 *
 * @export
 * @param {number} num
 * @returns {number} bytesCount
 */
export const numberByteSize = (num: number): number => {
  let bytes = 0;
  while ((num >> 8) !== 0)
    bytes++;

  return bytes;
};
