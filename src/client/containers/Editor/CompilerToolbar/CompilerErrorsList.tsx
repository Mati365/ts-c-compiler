import React from 'react';
import c from 'classnames';
import * as R from 'ramda';

import ErrorOutline from '@material-ui/icons/ErrorOutline';

import {useI18n} from '@ui/webapp/hooks';
import {CompilerError} from '@compiler/core/shared';

type CompilerErrorsListProps = {
  errors: CompilerError[],
};

export const CompilerErrorsList = ({errors}: CompilerErrorsListProps) => {
  const t = useI18n();
  const empty = !errors?.length;

  return (
    <ol
      className={c(
        'c-clean-list c-errors-list',
        empty && 'is-empty',
      )}
    >
      {(
        empty
          ? (
            <li className='c-errors-list__item'>
              {t('titles.compiler.no_errors')}
            </li>
          )
          : errors.map(
            (error) => (
              <li
                key={error.message}
                className='c-errors-list__item'
              >
                <ErrorOutline
                  className='c-errors-list__logo mr-2'
                  fontSize='small'
                />
                <span className='c-errors-list__message'>
                  {error.message}
                </span>
                <span className='c-errors-list__line text-muted text-small ml-2'>
                  {t('titles.compiler.error_line', R.mapObjIndexed(
                    R.when(R.is(Number), R.inc),
                    {
                      row: error.loc?.row ?? '-',
                      col: error.loc?.column ?? '-',
                    }),
                  )}
                </span>
              </li>
            ),
          )
      )}
    </ol>
  );
};

CompilerErrorsList.displayName = 'CompilerErrorsList';
