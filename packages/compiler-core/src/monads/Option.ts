type OptionMatch<T, O> = {
  some(value: T): O;
  none(): O;
};

export interface Option<T> {
  isNone(): boolean;
  isSome(): boolean;

  unwrap(): T;
  unwrapOr<D>(defaultValue: D): T | D;

  map<O>(fn: (value: T) => O): Option<O>;
  match<O>(match: OptionMatch<T, O>): O;

  tapSome(fn: (value: T) => void): void;
  tapNone(fn: () => void): void;
}

export class Some<T> implements Option<T> {
  constructor(private readonly value: T) {}

  isNone() {
    return false;
  }
  isSome() {
    return true;
  }

  map<O>(fn: (value: T) => O): Some<O> {
    return new Some(fn(this.value));
  }

  match<O>(match: OptionMatch<T, O>): O {
    return match.some(this.value);
  }

  tapSome(fn: (value: T) => void): void {
    fn(this.value);
  }

  tapNone(): void {}

  unwrap(): T {
    return this.value;
  }

  unwrapOr() {
    return this.value;
  }
}

export class None implements Option<never> {
  isNone() {
    return true;
  }
  isSome() {
    return false;
  }

  unwrap(): never {
    throw new Error('Cannot unwrap none!');
  }

  map(): None {
    return new None();
  }

  unwrapOr<D>(defaultValue: D) {
    return defaultValue;
  }

  match<O>(match: OptionMatch<never, O>): O {
    return match.none();
  }

  tapSome(): void {}

  tapNone(fn: () => void): void {
    fn();
  }
}

export const some = <T>(value: T = null): Some<T> => new Some<T>(value);
export const none = () => new None();
