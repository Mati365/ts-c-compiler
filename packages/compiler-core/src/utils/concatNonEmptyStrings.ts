/**
 * Removes empty strings from array and rest of items
 *
 * @export
 * @param {string[]} strings
 * @return {string}
 */
export function concatNonEmptyStrings(strings: string[]): string {
  return (strings || []).filter(Boolean).join(' ');
}
