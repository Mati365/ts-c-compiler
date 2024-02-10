import { useControlStrict } from '@under-control/forms';
import { useState } from 'react';

import constate from 'constate';

import type { EditorEmulationValue, EditorStateValue } from './types';

const useEditorStateValue = () => {
  const [emulation, setEmulation] = useState<EditorEmulationValue>({
    state: 'stop',
  });

  const control = useControlStrict<EditorStateValue>({
    defaultValue: {
      lang: 'c',
      code: 'int main() { return 0; }',
    },
  });

  const run = () => {
    setEmulation({
      state: 'running',
      result: 1,
    });
  };

  const pause = () => {
    setEmulation(oldState => {
      if (oldState.state === 'running') {
        return { state: 'pause', result: oldState.result };
      }

      return { state: 'stop' };
    });
  };

  const stop = () => {
    setEmulation({
      state: 'stop',
    });
  };

  return {
    control,
    emulation: {
      state: emulation.state,
      stop,
      pause,
      run,
    },
  };
};

export const [EditorStateProvider, useEditorState] = constate(useEditorStateValue);
