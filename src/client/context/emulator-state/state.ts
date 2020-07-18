import {CompilerFinalResult as AssemblerResult} from '@compiler/x86-assembler';

export enum EmulatorLanguage {
  ASM,
  C,
}

export enum EmulationState {
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
