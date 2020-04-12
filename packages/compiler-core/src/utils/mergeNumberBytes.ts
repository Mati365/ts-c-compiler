/**
 * Concats array of numbers into single digit
 *
 * @export
 * @param {number[]} num
 * @returns {number}
 */
export function mergeNumberBytes(num: number[]): number {
  let acc = 0;
  for (let i = 0; i < num.length; ++i)
    acc = (acc << 0x8) | num[i];

  return acc;
}
