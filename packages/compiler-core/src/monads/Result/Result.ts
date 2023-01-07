type ResultMatch<T, E, O> = {
  ok(value: T): O;
  err(value: E): O;
};

export abstract class Result<T, E, ValType = T | E> {
  constructor(protected readonly _value: ValType) {}

  abstract isErr(): boolean;
  abstract isOk(): boolean;

  /**
   * Returns value from Result
   */
  abstract unwrap(): T | never;
  abstract unwrapErr(): E | never;
  abstract unwrapOr(val: T): T;
  abstract unwrapOrThrow(): T;
  abstract unwrapBoth(): [E, T];

  /**
   * Executes function provided via arg with monad value and returns its value
   */
  abstract andThen<O>(fn: (val: T) => Result<O, E>): Result<O, E>;

  /**
   * Rust match alternative, executes ok/err callback based on type
   */
  abstract match<O>(match: ResultMatch<T, E, O>): O;

  /**
   * Modifies internal monad value and returns new value
   */
  abstract map<O>(fn: (fn: T) => O): Result<O, E>;
}

/**
 * Success value
 */
export class Ok<T, E = never> extends Result<T, E> {
  unwrap(): T {
    return this._value as T;
  }

  unwrapErr(): never {
    throw new Error('Cannot unwrap error from ok!');
  }

  unwrapOr(): T {
    return this._value as T;
  }

  unwrapOrThrow(): T {
    return this.unwrap();
  }

  unwrapBoth(): [E, T] {
    return [null, this._value as T];
  }

  isOk() {
    return true;
  }

  isErr() {
    return false;
  }

  match<O>(match: ResultMatch<T, E, O>): O {
    return match.ok(this._value as T);
  }

  map<O>(fn: (fn: T) => O): Ok<O, E> {
    return new Ok<O, E>(fn(this._value as T));
  }

  andThen<O>(fn: (val: T) => Result<O, E>): Result<O, E> {
    return fn(this._value as T);
  }
}

/**
 * Error value
 */
export class Err<T, E> extends Result<T, E> {
  unwrap(): T | never {
    throw new Error('Cannot unwrap error!');
  }

  unwrapErr(): E {
    return this._value as E;
  }

  unwrapOr<A = T>(a: A): A {
    return a;
  }

  unwrapOrThrow(): T {
    throw this._value as any;
  }

  unwrapBoth(): [E, T] {
    return [this._value as E, null];
  }

  isOk() {
    return false;
  }

  isErr() {
    return true;
  }

  match<O>(match: ResultMatch<T, E, O>): O {
    return match.err(this._value as E);
  }

  map<O>(): Err<O, E> {
    return new Err<O, E>(this._value as E);
  }

  andThen<O>(): Result<O, E> {
    return new Err<O, E>(this._value as E);
  }
}

export const ok = <T>(value: T = null): Result<T, never> => new Ok<T>(value);
export const err = <E>(value: E): Result<never, E> => new Err<never, E>(value);
