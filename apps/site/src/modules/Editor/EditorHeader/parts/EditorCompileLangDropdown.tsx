import { clsx } from 'clsx';
import { pipe } from 'fp-ts/function';
import { record as R, array as A } from 'fp-ts';
import { controlled } from '@under-control/forms';
import { Dropdown } from 'flowbite-react';
import { BiCog } from 'react-icons/bi';

import { useI18n } from 'i18n';
import type { EditorCompileLang } from 'modules';

type Props = {
  disabled?: boolean;
};

export const EditorCompileLangDropdown = controlled<EditorCompileLang, Props>(
  ({ disabled, control: { value, setValue } }) => {
    const t = useI18n().pack.header.compile.lang;

    return (
      <Dropdown
        disabled={disabled}
        label={
          <span className={clsx('flex items-center', disabled && 'text-gray-500')}>
            <BiCog size={16} className="mr-2 text-gray-400" />
            {[t[value]]}
          </span>
        }
        size="sm"
        inline
      >
        {pipe(
          t,
          R.toEntries,
          A.map(([lang, title]) => (
            <Dropdown.Item
              key={lang}
              id={lang}
              onClick={() => {
                setValue({
                  value: lang,
                });
              }}
            >
              {title}
            </Dropdown.Item>
          )),
        )}
      </Dropdown>
    );
  },
);
