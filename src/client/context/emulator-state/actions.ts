import {asm} from '@compiler/x86-assembler';
import {
  EmulationState,
  EmulatorLanguage,
  EmulatorState,
} from './state';

/**
 * Executes code, assign result into state and change emulation state
 *
 * @todo
 *  Add worker compilation!
 */
export const execCode = ({code, language}: {code: string, language: EmulatorLanguage}) => (state: EmulatorState) => {
  switch (language) {
    case EmulatorLanguage.ASM: {
      const output = asm(code);

      return {
        ...state,
        emulationState: output.match(
          {
            ok: () => EmulationState.RUNNING,
            err: () => EmulationState.STOPPED,
          },
        ),
        compilerOutput: {
          asm: output,
        },
      };
    }

    default:
      throw new Error('Unsupported language');
  }
};

/**
 * Stops emulator
 *
 * @param clearOutput If true - clears errors / warnings informations and blob
 */
export const stopExec = (clearOutput: boolean = false) => (state: EmulatorState) => ({
  ...state,
  emulationState: EmulationState.STOPPED,
  compilerOutput: (
    clearOutput
      ? {asm: null}
      : state.compilerOutput
  ),
});

export const EmulatorActions = {
  execCode,
  stopExec,
};
