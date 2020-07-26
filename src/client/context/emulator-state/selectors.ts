import {StateAccessor} from '@ui/context-state/ContextStateProvider';
import {EmulationState, EmulatorState} from './state';

export function createEmulatorSelectors(ctx: StateAccessor<EmulatorState>) {
  /**
   * Returns true if CPU is already executing code
   *
   * @returns
   */
  function isRunning() {
    return ctx.getState().emulationState === EmulationState.RUNNING;
  }

  return {
    isRunning,
  };
}

export type EmulatorSelectors = ReturnType<typeof createEmulatorSelectors>;
