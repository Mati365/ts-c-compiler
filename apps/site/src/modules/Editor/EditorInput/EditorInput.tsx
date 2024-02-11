import { clsx } from 'clsx';

import CodeMirror, { type ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { StreamLanguage } from '@codemirror/language';
import { controlled } from '@under-control/forms';

import type { EditorCompileLang } from '../EditorStateProvider/types';

import CSS from './EditorInput.module.scss';
import { nasmSyntaxDefine } from './syntax';

type EditorInputPops = Partial<ReactCodeMirrorProps> & {
  lang: EditorCompileLang;
};

export const EditorInput = controlled<string, EditorInputPops>(
  ({ lang, control: { value, setValue }, className, ...props }) => {
    const langProps: Partial<ReactCodeMirrorProps> = (() => {
      switch (lang) {
        case 'nasm':
          return {
            extensions: [StreamLanguage.define(nasmSyntaxDefine())],
          };

        case 'c':
          return {
            extensions: [cpp()],
          };

        default: {
          const unknownLang: never = lang;
          console.warn('Unknown lang', unknownLang);
          return {};
        }
      }
    })();

    return (
      <CodeMirror
        {...langProps}
        className={clsx(className, CSS['editor-codemirror'], 'min-w-[50%]')}
        value={value}
        onChange={newValue => {
          setValue({
            value: newValue,
          });
        }}
        {...props}
      />
    );
  },
);
