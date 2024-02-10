import * as R from 'ramda';

/**
 * Serializes hash of timings into string
 */
export function timingsToString(timings: Record<string, number>): string {
  return R.toPairs(timings)
    .map(([name, timing]) => `${name}: ${timing}ms`)
    .join('\n');
}

/**
 * Measures multiple functions in chain and assigns it to object
 */
export function createTiming<T extends Record<string, number>>(startValues: T) {
  const values: T = {
    ...startValues,
  };

  return {
    chainIO:
      <K extends keyof T, A extends Array<any>, R>(key: K, io: (...args: A) => R) =>
      (...args: A): R => {
        const start = Date.now();
        const result: R = io(...args);

        values[key] = <any>(Date.now() - start); // fixme

        return result;
      },
    unwrap: (): T & {
      total: number;
    } => ({
      ...values,
      total: R.reduce((acc, [, val]) => acc + (val || 0), 0, R.toPairs(values)),
    }),
    toString: () => timingsToString(values),
  };
}
