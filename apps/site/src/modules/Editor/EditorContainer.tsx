import { useControlStrict } from '@under-control/forms';
import { trimLines } from '@ts-c-compiler/core';

import type { EditorStateValue } from './types';

import { EditorInput } from './Input/EditorInput';

export const EditorContainer = () => {
  const { bind, value } = useControlStrict<EditorStateValue>({
    defaultValue: {
      lang: 'c',
      code: trimLines(`
        int main() { return 0; }
      `),
    },
  });

  console.info(value);

  return (
    <div className="flex justify-center items-center">
      <EditorInput lang={value.lang} {...bind.path('code')} />
    </div>
  );
};
