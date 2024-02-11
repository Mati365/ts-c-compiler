import { useEffect } from 'react';

import { useEditorState } from './EditorStateProvider';

import { EditorInput } from './EditorInput';
import { EditorHeader } from './EditorHeader';
import { EditorSidebar } from './EditorSidebar';
import { EditorOutput } from './EditorOutput';

export const EditorContainer = () => {
  const {
    control: { bind, value },
    emulation,
  } = useEditorState();

  useEffect(() => {
    emulation.run();
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <EditorHeader />

      <div className="relative flex-1">
        <div className="layer-absolute grid grid-cols-[1fr,700px,min-content]">
          <EditorInput
            {...bind.path('code')}
            lang={value.lang}
            className="border-r border-gray-100"
          />

          <EditorOutput className="border-r border-gray-100" />
          <EditorSidebar />
        </div>
      </div>
    </div>
  );
};
