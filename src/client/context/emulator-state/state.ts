import {CompilerFinalResult as AssemblerResult} from '@compiler/x86-assembler';

export enum EmulatorLanguage {
  ASM = 'ASM',
  C = 'C',
}

export enum EmulationState {
  STOPPED,
  RUNNING,
  PAUSE,
  BREAKPOINT,
}

export type EmulatorState = {
  emulationState: EmulationState,
  compilerOutput: {
    asm: AssemblerResult,
  },
};

export function createInitialEmulatorState(): EmulatorState {
  return {
    emulationState: EmulationState.STOPPED,
    compilerOutput: {
      asm: null,
    },
  };
}
