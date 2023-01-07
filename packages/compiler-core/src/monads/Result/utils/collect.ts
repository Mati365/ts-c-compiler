import * as R from 'ramda';

import { Result } from '../Result';
import { tryFold } from './tryFold';

export function collect<A, T, E>(
  array: A[] | Iterable<A>,
): Result<(T | null)[], E> {
  return tryFold<A, T, E>(<any>R.identity, <T[]>[], array);
}
