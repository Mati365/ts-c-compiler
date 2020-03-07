/**
 * Sets character at current position in string
 *
 * @export
 * @param {string} str
 * @param {number} index
 * @param {string} chr
 * @returns {string}
 */
export function setCharAt(str: string, index: number, chr: string): string {
  if (index > str.length - 1)
    return str;

  return str.substr(0, index) + chr + str.substr(index + 1);
}
