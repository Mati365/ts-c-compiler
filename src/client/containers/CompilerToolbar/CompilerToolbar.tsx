import React, {memo} from 'react';
import c from 'classnames';

import {
  useI18n,
  useInputLink,
  useUpdateEffect,
} from '@ui/webapp/hooks';

import {Nav, NavTab, Badge} from '@ui/webapp';
import {CompilerErrorsList} from './CompilerErrorsList';
import {CompilerBinaryGraph} from './CompilerBinaryGraph';

import {useEmulatorContext} from '../../context/emulator-state/context';

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

  useUpdateEffect(
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
        {() => 'LOGS'}
      </NavTab>

      <NavTab
        id={CompilerToolbarTabs.BINARY}
        title={
          t('titles.compiler.binary')
        }
      >
        {() => asmResult && !errors && (
          <CompilerBinaryGraph result={asmResult} />
        )}
      </NavTab>

      <NavTab
        id={CompilerToolbarTabs.AST}
        title={
          t('titles.compiler.ast')
        }
      >
        {() => (
          <div>
            AST
          </div>
        )}
      </NavTab>
    </Nav>
  );
});

CompilerToolbar.displayName = 'CompilerToolbar';
