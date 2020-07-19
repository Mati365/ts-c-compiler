import React, {memo} from 'react';

import {useI18n, useInputLink} from '@ui/webapp/hooks';

import {Button, Card} from '@ui/webapp';
import {CodeEditor} from '../../components/CodeEditor';
import {EmulatorLanguage} from '../../context/emulator-state/state';

import {useEmulatorContext} from '../../context/emulator-state/context';

type CodeEditorCardProps = {
  className?: string,
};

export const CodeEditorCard = memo(({className}: CodeEditorCardProps) => {
  const t = useI18n();
  const l = useInputLink<string>();
  const {execCode} = useEmulatorContext(
    ({actions}) => ({
      execCode: actions.execCode,
    }),
  );

  const onRun = () => {
    execCode(
      {
        language: EmulatorLanguage.ASM,
        code: l.value,
      },
    );
  };

  return (
    <Card
      className={className}
      contentSpaced={false}
      header={(
        <div className='d-flex flex-row flex-justify-space-between'>
          <Button
            type={Button.Type.PRIMARY}
            onClick={onRun}
          >
            {t('titles.run')}
          </Button>
        </div>
      )}
    >
      <CodeEditor {...l.input()} />
    </Card>
  );
});

CodeEditorCard.displayName = 'CodeEditorCard';
