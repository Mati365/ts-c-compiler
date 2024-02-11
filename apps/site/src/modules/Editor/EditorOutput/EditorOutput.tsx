import { Tabs } from 'flowbite-react';
import { BiCodeAlt } from 'react-icons/bi';
import { either as E } from 'fp-ts';

import { useI18n } from 'i18n';
import { hasEditorEmulationResult, useEditorState } from '../EditorStateProvider';

import { EditorOutputBinaryTab } from './EditorOutputBinaryTab';

type Props = {
  className?: string;
};

export const EditorOutput = ({ className }: Props) => {
  const t = useI18n().pack.output.tabs;
  const {
    emulation: { info },
  } = useEditorState();

  const hasResult = hasEditorEmulationResult(info);

  return (
    <Tabs
      className={className}
      style="underline"
      theme={{ tabitemcontainer: { base: 'flex-1 relative' } }}
    >
      {hasResult &&
        E.isRight(info.result) && [
          <Tabs.Item active key="binary" title={t.binary.title} icon={BiCodeAlt}>
            <EditorOutputBinaryTab asmPassOutput={info.result.right.asmPassOutput} />
          </Tabs.Item>,
        ]}
    </Tabs>
  );
};
