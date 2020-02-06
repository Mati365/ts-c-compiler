type ResultMatch<T, E> = {
  ok(value: T): void;
  err(value: E): void;
};

export abstract class Result<T, E, ValType = T|E> {
  protected _value: ValType;

  constructor(value: ValType) {
    this._value = value;
  }

  abstract isErr(): boolean;
  abstract isOk(): boolean;

  /**
   * Returns value from Result
   *
   * @abstract
   * @returns {ValType}
   * @memberof Result
   */
  abstract unwrap(): ValType;

  /**
   * Executes function provided via arg with monad value and returns its value
   *
   * @abstract
   * @param {(val: ValType) => ValType} fn
   * @returns {ValType}
   * @memberof Result
   */
  abstract andThen(fn: (val: ValType) => ValType): ValType;

  /**
   * Rust match alternative, executes ok/err callback based on type
   *
   * @abstract
   * @param {ResultMatch<T, E>} match
   * @memberof Result
   */
  abstract match(match: ResultMatch<T, E>): void;


  /**
   * Modifies internal monad value and returns new value
   *
   * @abstract
   * @param {(fn: T) => T} fn
   * @returns {Result<T, E>}
   * @memberof Result
   */
  abstract map(fn: (fn: T) => T): Result<T, E>;
}

/**
 * Success value
 *
 * @export
 * @class Ok
 * @extends {Result<T, E>}
 * @template T
 * @template E
 */
export class Ok<T, E = never> extends Result<T, E> {
  unwrap(): T {
    return <T> this._value;
  }

  andThen(fn: (val: T) => T): T {
    return fn(<T> this._value);
  }

  /* eslint-disable class-methods-use-this */
  isOk() { return true; }
  isErr() { return false; }
  /* eslint-enable class-methods-use-this */

  match(match: ResultMatch<T, E>): void {
    match.ok(<T> this._value);
  }

  map(fn: (fn: T) => T): Ok<T, E> {
    return new Ok<T, E>(fn(<T> this._value));
  }
}

/**
 * Error value
 *
 * @export
 * @class Err
 * @extends {Result<T, E>}
 * @template T
 * @template E
 */
export class Err<T, E> extends Result<T, E> {
  unwrap(): E {
    return <E> this._value;
  }

  andThen(): E {
    return <E> this._value;
  }

  /* eslint-disable class-methods-use-this */
  isOk() { return true; }
  isErr() { return false; }
  /* eslint-enable class-methods-use-this */

  match(match: ResultMatch<T, E>): void {
    match.err(<E> this._value);
  }

  map(): Err<T, E> {
    return new Err<T, E>(this._value);
  }
}

export const ok = <T>(value: T): Result<T, never> => new Ok<T>(value);
export const err = <E>(value: E): Result<never, E> => new Err<never, E>(value);
