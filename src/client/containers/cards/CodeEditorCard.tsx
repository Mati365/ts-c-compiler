import React, {memo} from 'react';
import {PlayCircleOutline, Stop} from '@material-ui/icons';

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
  const {execCode, stopExec, running} = useEmulatorContext(
    ({actions, selectors}) => ({
      running: selectors.isRunning(),
      execCode: actions.execCode,
      stopExec: actions.stopExec,
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

  const onStop = () => {
    stopExec(true);
  };

  const primaryActionButton = (
    running
      ? (
        <Button
          type={Button.Type.DANGER}
          title={t('titles.stop')}
          onClick={onStop}
        >
          <Stop />
          {t('titles.stop')}
        </Button>
      )
      : (
        <Button
          type={Button.Type.PRIMARY}
          title={t('titles.run')}
          onClick={onRun}
        >
          <PlayCircleOutline />
          {t('titles.run')}
        </Button>
      )
  );

  return (
    <Card
      className={className}
      contentSpaced={false}
      header={(
        <div className='d-flex flex-row flex-justify-space-between'>
          {primaryActionButton}
        </div>
      )}
    >
      <CodeEditor {...l.input()} />
    </Card>
  );
});

CodeEditorCard.displayName = 'CodeEditorCard';
