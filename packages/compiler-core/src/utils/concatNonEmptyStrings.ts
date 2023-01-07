/**
 * Removes empty strings from array and rest of items
 */
export function concatNonEmptyStrings(strings: string[]): string {
  return (strings || []).filter(Boolean).join(' ');
}
