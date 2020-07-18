import {createContextPack} from '@ui/context-state';
import {EmulatorState} from './state';
import {EmulatorActions} from './actions';

const {
  Provider,
  useStateContext,
} = createContextPack<EmulatorState, typeof EmulatorActions>();

export const EmulatorContextProvider = Provider;

export const useEmulatorContext = useStateContext;
