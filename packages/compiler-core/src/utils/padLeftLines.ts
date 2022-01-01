/**
 * Appends spaces to start of lines
 *
 * @export
 * @param {number} nesting
 * @param {string[]} lines
 * @return {string[]}
 */
export function padLeftLines(nesting: number, lines: string[]): string[] {
  return (
    lines
      .filter(Boolean)
      .map((line) => `${' '.padStart(nesting, ' ')}${line}`)
  );
}
