import * as R from 'ramda';

export const arrayToHex = R.map(
  (num: number) => (
    R.isNil(num)
      ? ''
      : `${num.toString(16).padStart(2, '0')}`
  ),
);

/**
 * Converts array of number to hex string
 *
 * @export
 * @param {number[]} numbers
 * @param {string} [delimeter=' ']
 * @returns {string}
 */
export function arrayToHexString(numbers: number[], delimeter: string = ' '): string {
  return R.join(
    delimeter,
    arrayToHex(numbers),
  );
}
