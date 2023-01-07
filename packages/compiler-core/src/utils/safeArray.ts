import * as R from 'ramda';

/**
 * Always returns array, even if provided single value
 */
export function safeArray<T>(array: T | T[]): T[] {
  if (R.is(Array, array)) {
    return <T[]>array;
  }

  return [<T>array];
}
