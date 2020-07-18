import {CompilerFinalResult} from '@compiler/x86-assembler';

export enum EmulationState {
  RUNNING,
  PAUSE,
  BREAKPOINT,
}

export type EmulatorState = {
  emulationState: EmulationState,
  compilerOutput: CompilerFinalResult,
};
