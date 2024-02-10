import { useEditorState } from './EditorStateProvider';

import { EditorInput } from './Input';
import { EditorHeader } from './Header';
import { EditorSidebar } from './EditorSidebar';

export const EditorContainer = () => {
  const {
    control: { bind, value },
  } = useEditorState();

  return (
    <div className="flex h-screen flex-col">
      <EditorHeader />

      <div className="relative flex-1">
        <div className="layer-absolute grid grid-cols-[1fr,40%]">
          <EditorInput
            {...bind.path('code')}
            lang={value.lang}
            className="border-r border-gray-100"
          />

          <EditorSidebar />
        </div>
      </div>
    </div>
  );
};
