import type { Nullable } from '../types';

export const shallowCompareArrays = <T>(
  a: Nullable<readonly T[]>,
  b: Nullable<readonly T[]>,
) => {
  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
};
