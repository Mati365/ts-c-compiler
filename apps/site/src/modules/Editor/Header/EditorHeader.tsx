import { EditorEmulationToolbar } from './EditorEmulationToolbar';
import { EditorCompilationToolbar } from './EditorCompilationToolbar';
import { EditorLinksToolbar } from './EditorLinksToolbar';

export const EditorHeader = () => (
  <header
    className="color-red grid w-full grid-cols-3 items-center justify-between border-b
border-gray-200 bg-white px-4 py-2"
  >
    <EditorEmulationToolbar />
    <EditorCompilationToolbar />
    <EditorLinksToolbar />
  </header>
);
