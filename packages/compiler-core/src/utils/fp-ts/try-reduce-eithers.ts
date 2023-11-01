import * as E from 'fp-ts/Either';

export function tryReduceEithers<A, T, E>(
  mapper: (acc: T, item: A) => E.Either<E, T>,
  init: T,
  array: A[] | Iterable<A>,
): E.Either<E, T | null> {
  let acc: T = init;

  for (const item of array) {
    const result = mapper(acc, item);

    if (result) {
      if (E.isLeft(result)) {
        return result;
      }

      acc = result.right;
    } else {
      acc = null;
    }
  }

  return E.right(acc);
}
