import {identity} from 'ramda';
import {
  useRef,
  useReducer,
} from 'react';

import {shallowDiffers} from '@compiler/core/utils/shallowDiffers';
import {useIsomorphicLayoutEffect} from './useIsomorphicLayoutEffect';

export type ComputedState<S, A, SS> = {
  state: S,
  actions: A,
  selectors: SS,
};

export type StateSelectorFn<S, R> = (computedState: S) => R;

export type StateSubscriber<S> = (computedState: S) => void;

export type StateContext<S, A, SS> = {
  getState(): ComputedState<S, A, SS>,
  subscribe(subscriber: StateSubscriber<ComputedState<S, A, SS>>): void;
  unsubscribe(subscriber: StateSubscriber<ComputedState<S, A, SS>>): void;
};

/**
 * Mounts state selector and watches state updates
 *
 * @export
 * @template S state type
 * @template A actions type
 * @template SS selectors type
 * @template R return type
 * @param {StateContext<S>} subscribeContext
 * @param {StateSelectorFn<S, T>} selectorFn
 * @returns {T}
 */
export function useSubscribedStateContext<S, A = {}, SS = {}, R = any>(
  subscribeContext: StateContext<S, A, SS>,
  selectorFn: StateSelectorFn<ComputedState<S, A, SS>, R>,
): R {
  const [, forceRender] = useReducer((s) => s + 1, 0);

  const latestSelectorRef = useRef<typeof selectorFn>();
  const latestStateRef = useRef<R>(null);

  latestSelectorRef.current = selectorFn;
  if (latestStateRef.current === null) {
    let selectorState = null;

    if (!subscribeContext?.getState) {
      selectorState = {
        stateNotInitialized: true,
      };
    } else
      selectorState = (selectorFn || identity)(subscribeContext.getState());

    latestStateRef.current = selectorState;
  }

  useIsomorphicLayoutEffect(
    () => {
      const updateState = (newComputedState: ComputedState<S, A, SS>) => {
        const selectorValue = latestSelectorRef.current(newComputedState);

        if (shallowDiffers(latestStateRef.current, selectorValue)) {
          latestStateRef.current = selectorValue;
          forceRender();
        }
      };

      if (!subscribeContext.subscribe)
        return undefined;

      subscribeContext.subscribe(updateState);
      return () => subscribeContext.unsubscribe(updateState);
    },
    [subscribeContext],
  );

  return latestStateRef.current;
}
