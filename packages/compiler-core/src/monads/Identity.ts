import * as R from 'ramda';
import { IsEqual } from '../interfaces';

/**
 * Monad that holds only one value
 */
export class Identity<T> implements IsEqual<Identity<T>> {
  protected readonly value: Readonly<T>;

  constructor(value: T) {
    this.value = Object.freeze(value);
  }

  isEqual(value: Identity<T>): boolean {
    if (!value) {
      return false;
    }

    return R.equals(this.value, value.unwrap());
  }

  unwrap() {
    return this.value;
  }

  bind<O>(fn: (value: T) => O): O {
    return fn(this.value);
  }

  map(fn: (value: T) => T): this {
    return new (this.constructor as any)(this.bind(fn));
  }
}
