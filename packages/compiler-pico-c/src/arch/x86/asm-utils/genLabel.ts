const DEFAULT_UNIQ_PREFIX = '@@_';

export function genLabelName(name: string): string {
  return `${DEFAULT_UNIQ_PREFIX}${name.replace(/[{}]/g, '_')}`;
}

export function genLabel(name: string): string {
  return `${genLabelName(name)}:`;
}
