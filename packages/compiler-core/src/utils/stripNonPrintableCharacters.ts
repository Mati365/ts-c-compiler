export function stripNonPrintableCharacters(text: string): string {
  return text
    .replace(/\p{C}/gu, '')
    .replace(/\n\r/g, '\n')
    .replace(/\p{Zl}/gu, '\n')
    .replace(/\p{Zp}/gu, '\n')
    .replace(/\p{Zs}/gu, ' ');
}
