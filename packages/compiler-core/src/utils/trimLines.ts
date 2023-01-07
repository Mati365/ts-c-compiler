export function trimLines(str: string): string {
  if (!str) {
    return null;
  }

  return str
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
}
