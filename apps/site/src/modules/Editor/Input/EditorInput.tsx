import { clsx } from 'clsx';
import 'codemirror/mode/clike/clike';
import 'codemirror/lib/codemirror.css';

import { Controlled as CodeMirror, type ICodeMirror } from 'react-codemirror2';
import { controlled } from '@under-control/forms';

import type { EditorLang } from '../EditorStateProvider/types';

import { nasmSyntaxDefine } from './syntax';
import CSS from './EditorInput.module.scss';

type EditorInputPops = ICodeMirror & {
  lang: EditorLang;
};

export const EditorInput = controlled<string, EditorInputPops>(
  ({ lang, control: { value, setValue }, className, ...props }) => {
    const langProps: Partial<ICodeMirror> = (() => {
      switch (lang) {
        case 'nasm':
          return {
            defineMode: {
              name: 'lang',
              fn: nasmSyntaxDefine,
            },
          };

        case 'c':
          return {
            options: {
              mode: 'clike',
            },
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
        options={{
          ...langProps.options,
          lineNumbers: true,
        }}
        value={value}
        onBeforeChange={(_, __, newValue) => {
          setValue({
            value: newValue,
          });
        }}
        {...props}
      />
    );
  },
);
