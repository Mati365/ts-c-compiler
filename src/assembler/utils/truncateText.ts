export function truncateText(suffix: string, maxLen: number, str: string): string {
  if (str.length < maxLen)
    return str;

  return `${str.substr(0, maxLen)}${suffix}`;
}
