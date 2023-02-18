const DEFAULT_UNIQ_PREFIX = '@@_';

export function genLabelName(name: string): string {
  return `${DEFAULT_UNIQ_PREFIX}${name.replace(/[{}]/g, '_')}`;
}

/**
 * @todo
 *  Move it to compiler context! Compiler should generate unique
 *  label prefix per compilation unit!
 */
export function genLabel(name: string, prefix?: boolean): string {
  const inner = prefix ? genLabelName(name) : name;

  return `${inner}:`;
}
