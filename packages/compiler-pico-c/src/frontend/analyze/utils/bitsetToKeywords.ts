import * as R from 'ramda';

import { hasFlag } from '@ts-cc/core';

/**
 * 0b0110 => ['long', 'short']
 */
export function bitsetToKeywords(
  bitmap: Record<string, number>,
  number: number,
): string[] {
  if (R.isNil(number)) {
    return [];
  }

  const keywords: string[] = [];
  R.forEachObjIndexed((flag, keyword) => {
    if (hasFlag(flag, number)) {
      keywords.push(keyword);
    }
  }, bitmap);

  return keywords;
}
