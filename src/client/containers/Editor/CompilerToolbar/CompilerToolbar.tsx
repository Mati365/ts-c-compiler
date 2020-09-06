import React, {memo, useEffect} from 'react';
import c from 'classnames';

import {
  useI18n,
  useInputLink,
} from '@ui/webapp/hooks';

import {useEmulatorContext} from '@client/context/emulator-state/context';

import {Nav, NavTab, Badge} from '@ui/webapp';
import {CompilerErrorsList} from './CompilerErrorsList';
import {CompilerBinaryGraph} from './CompilerBinaryGraph';
import {CompilerStats} from './CompilerStats';

enum CompilerToolbarTabs {
  BINARY = 'binary',
  ERRORS = 'errors',
  LOGS = 'logs',
  AST = 'ast',
}

type CompilerToolbarProps = {
  className?: string,
};

export const CompilerToolbar = memo(({className}: CompilerToolbarProps) => {
  const t = useI18n();
  const navInput = useInputLink<CompilerToolbarTabs>(
    {
      initialData: CompilerToolbarTabs.ERRORS,
    },
  );

  const {compilerOutput: {asm: asmResult}} = useEmulatorContext(
    ({state}) => ({
      compilerOutput: state.compilerOutput,
    }),
  );

  const [errors, output] = asmResult?.unwrapBoth() || [];
  const successCompilation = asmResult && !errors;

  useEffect(
    () => {
      navInput.setValue(
        errors?.length
          ? CompilerToolbarTabs.ERRORS
          : CompilerToolbarTabs.BINARY,
      );
    },
    [output],
  );

  return (
    <Nav
      {...navInput.input()}
      className={c(
        'c-compiler-toolbar',
        className,
      )}
    >
      <NavTab
        id={CompilerToolbarTabs.ERRORS}
        title={(
          <>
            {t('titles.compiler.errors')}
            {errors && (
              <Badge
                className='ml-2'
                type={Badge.Type.DANGER}
              >
                {errors.length}
              </Badge>
            )}
          </>
        )}
      >
        {() => (
          <CompilerErrorsList errors={errors} />
        )}
      </NavTab>

      <NavTab
        id={CompilerToolbarTabs.LOGS}
        title={
          t('titles.compiler.logs')
        }
      >
        {() => successCompilation && (
          <CompilerStats result={asmResult} />
        )}
      </NavTab>

      <NavTab
        id={CompilerToolbarTabs.BINARY}
        title={
          t('titles.compiler.binary')
        }
      >
        {() => successCompilation && (
          <CompilerBinaryGraph result={asmResult} />
        )}
      </NavTab>
    </Nav>
  );
});

CompilerToolbar.displayName = 'CompilerToolbar';
