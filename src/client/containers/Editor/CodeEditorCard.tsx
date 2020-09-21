import React, {memo} from 'react';

import PlayCircleOutline from '@material-ui/icons/PlayCircleOutline';
import Stop from '@material-ui/icons/Stop';

import HELLO_WORLD_ASM from '@client/examples/helloWorld.asm';

import {useI18n, useInputLink} from '@ui/webapp/hooks';
import {useEmulatorContext} from '@client/context/emulator-state/context';

import {SizeType} from '@ui/webapp/shared/types';
import {Button, Card} from '@ui/webapp';
import {CodeEditor} from '@client/components/CodeEditor';
import {EmulatorLanguage} from '@client/context/emulator-state/state';

type CodeEditorCardProps = {
  className?: string,
};

export const CodeEditorCard = memo(({className}: CodeEditorCardProps) => {
  const t = useI18n();
  const l = useInputLink<string>(
    {
      initialData: HELLO_WORLD_ASM,
    },
  );

  const {execCode, stopExec, running} = useEmulatorContext(
    ({actions, selectors, state}) => ({
      compilerOutput: state.compilerOutput,
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
          size={SizeType.SMALL}
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
          size={SizeType.SMALL}
          title={t('titles.run')}
          onClick={onRun}
        >
          <PlayCircleOutline />
          {t('titles.run')}
        </Button>
      )
  );

  return (
    <div className={className}>
      <Card
        contentSpaced={false}
        header={(
          <div className='d-flex flex-row flex-justify-space-between'>
            {primaryActionButton}
          </div>
        )}
      >
        <CodeEditor {...l.input()} />
      </Card>
    </div>
  );
});

CodeEditorCard.displayName = 'CodeEditorCard';
