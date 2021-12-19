import {dumpAttributesToString} from '@compiler/core/utils';

/**
 * Appends custom flags to specific fields such as struct members (offsets)
 *
 * @export
 * @param {object} attrs
 * @return {string}
 */
export function dumpCompilerAttrs(attrs: object): string {
  return `[[${dumpAttributesToString(null, attrs)}]]`;
}
