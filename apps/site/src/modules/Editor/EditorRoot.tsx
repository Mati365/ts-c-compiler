import { I18nProvider } from '../../i18n';
import { EditorContainer } from './EditorContainer';
import { EditorStateProvider } from './EditorStateProvider';

export const EditorRoot = () => (
  <I18nProvider>
    <EditorStateProvider>
      <EditorContainer />
    </EditorStateProvider>
  </I18nProvider>
);
