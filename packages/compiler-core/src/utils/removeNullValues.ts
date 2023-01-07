import * as R from 'ramda';

export function removeNullValues<T>(obj: T): T {
  return R.pickBy(R.complement(R.isNil), obj);
}
