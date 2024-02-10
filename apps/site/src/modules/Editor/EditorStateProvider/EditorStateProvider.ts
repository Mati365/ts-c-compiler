import { useControlStrict } from '@under-control/forms';
import constate from 'constate';

import type { EditorStateValue } from './types';

const useEditorStateValue = () => {
  const control = useControlStrict<EditorStateValue>({
    defaultValue: {
      lang: 'c',
      code: 'int main() { return 0; }',
    },
  });

  return {
    control,
  };
};

export const [EditorStateProvider, useEditorState] = constate(useEditorStateValue);
