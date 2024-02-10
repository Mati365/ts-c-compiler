/**
 * Appends spaces to start of lines
 */
export function padLeftLines(nesting: number, lines: string[]): string[] {
  return lines.filter(Boolean).map(line => `${' '.padStart(nesting, ' ')}${line}`);
}
