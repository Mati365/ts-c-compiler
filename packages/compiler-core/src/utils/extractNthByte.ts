/**
 * Changes nth byte in number
 *
 * @param {number} nth
 * @param {number} number
 * @param {number} byte
 * @returns {number}
 */
export function replaceNthByte(nth: number, number: number, byte: number): number {
  const nthBit = nth << 3;

  return (number & ~(0xFF << nthBit)) | (byte << nthBit);
}

/**
 * Extract nth byte from number
 *
 * @see
 *  Numbers in javascript are 32bits! Overflow does not fill from left!
 *
 * @export
 * @param {number} nth
 * @param {number} num
 * @returns {number}
 */
export function extractNthByte(nth: number, num: number): number {
  if (nth >= 4)
    return 0;

  return (num >>> (nth * 0x8)) & 0xFF;
}

/**
 * Extends digit to byteSize number of bytes
 * and emits array of bytes of data
 *
 * @param {number} byteSize
 * @param {number} num
 * @returns {number[]}
 */
export function extractMultipleNumberBytes(byteSize: number, num: number): number[] {
  const buffer: number[] = [];

  for (let i = 0; i < byteSize; ++i)
    buffer.push(extractNthByte(i, num));

  return buffer;
}

/**
 * Extracts array of bytes from text
 *
 * @export
 * @param {number} byteSize
 * @param {string} str
 * @returns {number[]}
 */
export function extractBytesFromText(byteSize: number, str: string): number[] {
  const buffer: number[] = [];

  for (let i = 0; i < str.length; ++i) {
    buffer.push(
      ...extractMultipleNumberBytes(byteSize, str.charCodeAt(i)),
    );
  }

  return buffer;
}

/**
 * Reduces short text into single binary digit (up to 64bits which has 8 bytes)
 *
 * @export
 * @param {string} str
 * @returns {number}
 */
export function reduceTextToBitset(str: string): number {
  if (!str || str.length > 8)
    return null;

  let acc = 0;
  for (let i = 0; i < str.length; ++i)
    acc |= (+str.charCodeAt(i)) << (i * 0x8);

  return acc;
}
