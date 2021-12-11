import * as R from 'ramda';

import {hasFlag} from '@compiler/core/utils';

/**
 * 0b0110 => ['long', 'short']
 *
 * @static
 * @param {Record<string, number>} bitmap
 * @param {number} number
 * @return {string[]}
 */
export function bitsetToKeywords(bitmap: Record<string, number>, number: number): string[] {
  const keywords: string[] = [];

  R.forEachObjIndexed(
    (flag, keyword) => {
      if (hasFlag(flag, number))
        keywords.push(keyword);
    },
    bitmap,
  );

  return keywords;
}
