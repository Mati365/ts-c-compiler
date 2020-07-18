import {asm} from '@compiler/x86-assembler';
import {EmulationState, EmulatorLanguage, EmulatorState} from './state';

/**
 * Executes code, assign result into state and change emulation state
 *
 * @todo
 *  Add worker compilation!
 */
export const execCode = ({code, language}: {code: string, language: EmulatorLanguage}) => (state: EmulatorState) => {
  const newState = {
    ...state,
    emulationState: EmulationState.RUNNING,
  };

  switch (language) {
    case EmulatorLanguage.ASM:
      return {
        ...newState,
        compilerOutput: {
          asm: asm(code),
        },
      };

    default:
      throw new Error('Unsupported language');
  }
};

export const EmulatorActions = {
  execCode,
};
