export function genLabel(name: string, prefix: string = '@@_'): string {
  return `${prefix}${name.replace(/[{}]/g, '_')}:`;
}
