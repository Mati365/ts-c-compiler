import {createContextPack} from '@ui/context-state';
import {createInitialEmulatorState, EmulatorState} from './state';
import {EmulatorActions} from './actions';

const {
  Provider,
  useStateContext,
} = createContextPack<EmulatorState, typeof EmulatorActions>(
  {
    initialState: createInitialEmulatorState(),
    actions: EmulatorActions,
  },
);

export const EmulatorContextProvider = Provider;

export const useEmulatorContext = useStateContext;
