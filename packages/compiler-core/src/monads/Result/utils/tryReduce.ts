import { Result, Err, ok } from '../Result';

/**
 * Reduces to array of items, if error halts and return error
 */
export function tryReduce<A, T, E>(
  mapper: (acc: T, item: A) => Result<T, E>,
  init: T,
  array: A[] | Iterable<A>,
): Result<T | null, E> {
  let acc: T = init;

  for (const item of array) {
    const result = mapper(acc, item);

    if (result) {
      if (result.isErr()) {
        return <Err<never, E>>result;
      }

      acc = result.unwrap();
    } else {
      acc = null;
    }
  }

  return ok(acc);
}
