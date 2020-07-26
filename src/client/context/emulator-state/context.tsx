import {createContextPack} from '@ui/context-state';
import {createInitialEmulatorState, EmulatorState} from './state';
import {createEmulatorSelectors, EmulatorSelectors} from './selectors';
import {EmulatorActions} from './actions';

const {
  Provider,
  useStateContext,
} = createContextPack<EmulatorState, typeof EmulatorActions, EmulatorSelectors>(
  {
    initialState: createInitialEmulatorState(),
    actions: EmulatorActions,
    selectors: createEmulatorSelectors,
  },
);

export const EmulatorContextProvider = Provider;

export const useEmulatorContext = useStateContext;
