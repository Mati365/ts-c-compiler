import React, {memo} from 'react';
import c from 'classnames';
import * as R from 'ramda';

import {useI18n} from '@ui/webapp/hooks';

import {CompilerError} from '@compiler/core/shared';
import {Nav, NavTab, Badge} from '@ui/webapp';
import {CompilerErrorsList} from './CompilerErrorsList';

import {useEmulatorContext} from '../../context/emulator-state/context';

type CompilerToolbarProps = {
  className?: string,
};

export const CompilerToolbar = memo(({className}: CompilerToolbarProps) => {
  const t = useI18n();
  const {compilerOutput} = useEmulatorContext(
    ({state}) => ({
      compilerOutput: state.compilerOutput,
    }),
  );

  const errors = compilerOutput.asm?.match<CompilerError[]>(
    {
      ok: () => null,
      err: R.identity,
    },
  );

  return (
    <Nav
      className={c(
        'c-compiler-toolbar mt-3',
        className,
      )}
    >
      <NavTab
        id='errors'
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
        id='logs'
        title={
          t('titles.compiler.logs')
        }
      >
        {() => (
          <div>
            Logs
          </div>
        )}
      </NavTab>

      <NavTab
        id='binary'
        title={
          t('titles.compiler.binary')
        }
      >
        {() => (
          <div>
            Binary
          </div>
        )}
      </NavTab>

      <NavTab
        id='ast'
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
