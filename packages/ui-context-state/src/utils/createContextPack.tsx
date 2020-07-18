import React, {useContext, ReactNode} from 'react';

import {
  ContextStateProvider,
  ContextStateProviderProps,
} from '../ContextStateProvider';

import {
  useSubscribedStateContext,
  StateSelectorFn,
  StateContext,
  ComputedState,
} from '../hooks/useSubscribedStateContext';

type FactoryContextProviderProps<S, A, SS> = Omit<ContextStateProviderProps<S, A, SS>, 'contextComponent'>;

/**
 * Create provider, hooks etc used in state
 *
 * @export
 * @template S state type
 * @template A actions type
 * @template SS selector type
 * @param {FactoryContextProviderProps<S>} [providerProps]
 * @returns
 */
export function createContextPack<S, A = {}, SS = {}>(providerProps?: FactoryContextProviderProps<S, A, SS>) {
  const Context = React.createContext<StateContext<S, A, SS>>(null);
  const useReactContext = () => useContext(Context);

  function useStateContext<R>(
    selectorFn?: StateSelectorFn<ComputedState<S, A, SS>, R>,
    subscribed: boolean = true, // it should never change due to lifecycle of component otherwise it will break hook
  ): R {
    const ctx = useReactContext();

    if (subscribed) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useSubscribedStateContext<S>(ctx, selectorFn);
    }

    return selectorFn(ctx.getState());
  }

  return {
    useStateContext,
    useReactContext,

    Context,
    Consumer: ({children}) => children(
      useStateContext<ReactNode>(),
    ),

    Provider: (props: FactoryContextProviderProps<S, A, SS>) => (
      <ContextStateProvider
        {...props}
        {...providerProps}
        contextComponent={Context.Provider}
      />
    ),
  };
}
