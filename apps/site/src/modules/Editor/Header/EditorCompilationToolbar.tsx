import { useEditorState } from '..';
import { EditorCompileLangDropdown } from './parts';

export const EditorCompilationToolbar = () => {
  const { control, emulation } = useEditorState();

  return (
    <div className="flex justify-center">
      <EditorCompileLangDropdown
        {...control.bind.path('lang')}
        disabled={emulation.info.state !== 'stop'}
      />
    </div>
  );
};
