/**
 * Compares two arrays
 *
 * @export
 * @template A
 * @template B
 * @param {A[]} a
 * @param {B[]} b
 * @returns {boolean}
 */
export function shallowNotEqArray<A, B>(a: A[], b: B[]): boolean {
  if (a.length !== b.length)
    return true;

  for (let i = a.length - 1; i >= 0; --i) {
    if (<any> a[i] !== <any> b[i])
      return true;
  }

  return false;
}

/**
 * Caches function, call it only when arg change.
 * Instead R.memoizeWith it doesnt generate any keys,
 * just check if previous args are equal to current.
 * Its much lighter than reselect
 *
 * Function params have to be serializable!
 *
 * @export
 * @template A
 * @template T
 * @param {(prev: A, current: A) => boolean} cacheFn
 * @returns
 */
export function cacheOneCall<A extends [any] | any[]>(cacheFn: (prev?: A, current?: A) => boolean) {
  return <T> (fn: (...args: A) => T): (...args: A) => T => {
    let previousArgs: A = null;
    let previousReturn: T = null;

    return function memoize(...args: A): T {
      if (previousArgs !== null && !cacheFn(previousArgs, args))
        return previousReturn;

      previousReturn = fn(...args);
      previousArgs = args;
      return previousReturn;
    };
  };
}

/**
 * Cache using default function
 *
 * @export
 * @template A
 * @template T
 * @param {(...args: A) => T} fn
 * @returns
 */
export function shallowMemoizeOneCall<A extends [any] | any[], T>(fn: (...args: A) => T): (...args: A) => T {
  return cacheOneCall<A>(shallowNotEqArray)(fn);
}
