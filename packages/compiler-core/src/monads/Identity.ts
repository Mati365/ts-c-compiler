import * as R from 'ramda';
import {IsEqual} from '../interfaces';

/**
 * Monad that holds only one value
 *
 * @export
 * @class Identity
 * @template T
 */
export class Identity<T> implements IsEqual<Identity<T>> {
  constructor(
    protected readonly value: T,
  ) {}

  isEqual(value: Identity<T>): boolean {
    if (!value)
      return false;

    return R.equals(this.value, value.unwrap());
  }

  unwrap() {
    return this.value;
  }

  bind<O>(fn: (value: T) => O): O {
    return fn(this.value);
  }

  map(fn: (value: T) => T): Identity<T> {
    return new Identity(
      this.bind(fn),
    );
  }
}
