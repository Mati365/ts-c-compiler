/**
 * Sets character at current position in string
 */
export function setCharAt(str: string, index: number, chr: string): string {
  if (index > str.length - 1) {
    return str;
  }

  return str.substr(0, index) + chr + str.substr(index + 1);
}
