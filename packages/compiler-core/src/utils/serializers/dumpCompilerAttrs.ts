import { dumpAttributesToString } from './dumpAttributesToString';

/**
 * Appends custom flags to specific fields such as struct members (offsets)
 */
export function dumpCompilerAttrs(attrs: object): string {
  return `[[${dumpAttributesToString(null, attrs)}]]`;
}
