import * as R from 'ramda';

export type Observable<T> = {
  notify(val: T): void;
  subscribe(fn: (val: T, unmounter?: VoidFunction) => void, oneTime?: boolean): () => void;
  clear(): void;
};

type EmitterFn<T> = (obserable: Observable<T>) => () => any;

type BehaviorSubjectObservableArgs<T> = {
  emitterFn?: EmitterFn<T>,
  initialValue?: T,
  comparatorFn?: (a: T, b: T) => boolean,
};

export class BehaviorSubjectObservable<T> implements Observable<T> {
  private observers: ((val: T) => void)[] = [];
  private lastValue: T = null;
  private comparatorFn: (a: T, b: T) => boolean = null;
  private emitterUnmountFn: () => any = null;

  constructor(
    {
      initialValue,
      comparatorFn = R.equals,
      emitterFn,
    } : BehaviorSubjectObservableArgs<T> = {
      initialValue: null,
    },
  ) {
    this.lastValue = initialValue;
    this.comparatorFn = comparatorFn;
    this.emitterUnmountFn = emitterFn && emitterFn(this);
  }

  setValue(val: T): BehaviorSubjectObservable<T> {
    this.lastValue = val;
    return this;
  }

  getLastValue(): T {
    return this.lastValue;
  }

  destroyEmitter() {
    const {emitterUnmountFn} = this;

    if (emitterUnmountFn)
      emitterUnmountFn();
  }

  notify(val: T): BehaviorSubjectObservable<T> {
    const {observers, comparatorFn} = this;

    if (comparatorFn(this.lastValue, val))
      return this;

    this.lastValue = val;
    for (let i = 0; i < observers.length; ++i)
      observers[i](val);

    return this;
  }

  subscribe(fn: (val: T, unmounter?: VoidFunction) => void, oneTime?: boolean): () => void {
    const cachedFn = fn;
    const unmounterRef = {
      current: null,
    };

    if (oneTime) {
      fn = (val: T): void => {
        unmounterRef.current();
        cachedFn(val, unmounterRef.current);
      };
    } else
      fn = (val: T): void => cachedFn(val, unmounterRef.current);

    this.observers.push(fn);
    unmounterRef.current = () => {
      this.observers = R.without([fn], this.observers);
    };

    return unmounterRef.current;
  }

  clear() {
    this.observers = [];
    this.lastValue = null;
  }
}

export const createObservablesUnmounter = (...unmounters: VoidFunction[]) => () => {
  for (let i = 0; i < unmounters.length; ++i)
    unmounters[i]();
};
