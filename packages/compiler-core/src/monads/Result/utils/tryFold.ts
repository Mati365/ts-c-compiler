import {Result, Err, ok} from '../Result';

/**
 * Reduces array of items to accumulator, if error stops and return error result
 *
 * @export
 * @template T
 * @template E
 * @template A
 * @param {(a: A) => Result<T, E>} mapper
 * @param {Ok<T>[]} init
 * @param {A[]} array
 * @returns {Result<Ok<T>[], E>}
 */
export function tryFold<A, T, E>(
  mapper: (a: A) => Result<T, E>,
  init: T[],
  array: A[] | Iterable<A>,
): Result<(T | null)[], E> {
  const acc: T[] = init || [];

  for (const item of array) {
    const result = mapper(item);

    if (result) {
      if (result.isErr())
        return <Err<never, E>> result;

      acc.push(<T> result.unwrap());
    } else
      acc.push(<null> result);
  }

  return ok(acc);
}
