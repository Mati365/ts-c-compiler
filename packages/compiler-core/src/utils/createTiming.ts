import * as R from 'ramda';

/**
 * Measures multiple functions in chain and assigns it to object
 *
 * @export
 * @template T
 * @param {T} startValues
 * @returns
 */
export function createTiming<T extends Record<string, number>>(startValues: T) {
  const values: T = {
    ...startValues,
  };

  return {
    add<K extends keyof T, A extends Array<any>, U>(key: K, fn: (...args: A) => U) {
      return (...args: A): U => {
        const start = performance.now();
        const result: U = fn(...args);
        values[key] = <any>(performance.now() - start); // fixme
        return result;
      };
    },
    unwrap(): T & {total: number} {
      return {
        ...values,
        total: R.reduce(
          (acc, [, val]) => acc + (val || 0),
          0,
          R.toPairs(values),
        ),
      };
    },
  };
}
