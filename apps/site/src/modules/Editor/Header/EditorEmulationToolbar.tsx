import { Button } from 'flowbite-react';
import { BiPause, BiPlay, BiStop } from 'react-icons/bi';

import { useI18n } from 'i18n';
import { useEditorState } from '../EditorStateProvider';

export const EditorEmulationToolbar = () => {
  const t = useI18n().pack.header;
  const { emulation } = useEditorState();
  const { state } = emulation.info;

  return (
    <ol className="flex flex-row gap-2">
      <li>
        <Button
          color="success"
          size="xs"
          className="font-bold"
          disabled={state !== 'stop' && state !== 'pause'}
          onClick={emulation.run}
        >
          {t.run}

          <BiPlay size={24} className="ml-1" />
        </Button>
      </li>

      <li>
        <Button
          color="gray"
          size="xs"
          disabled={state !== 'running'}
          onClick={emulation.pause}
        >
          {t.pause}

          <BiPause size={24} className="ml-1" />
        </Button>
      </li>

      <li>
        <Button
          color="failure"
          size="xs"
          disabled={state !== 'running' && state !== 'pause'}
          onClick={emulation.stop}
        >
          {t.stop}

          <BiStop size={24} className="ml-1" />
        </Button>
      </li>
    </ol>
  );
};
