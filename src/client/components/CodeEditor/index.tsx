import React from 'react';
import {Controlled as CodeMirror, ICodeMirror} from 'react-codemirror2';

import {linkInputs, LinkProps} from '../../decorators/linkInputs';
import {nasmSyntaxDefine} from './nasmSyntaxDefine';

type CodeEditorProps = LinkProps<string> & ICodeMirror;

export const CodeEditor = linkInputs<string>()(({value, l, initialData, ...props}: CodeEditorProps) => (
  <CodeMirror
    className='o-code-editor'
    options={{
      lineNumbers: true,
    }}
    defineMode={{
      name: 'nasm',
      fn: nasmSyntaxDefine,
    }}
    value={value}
    onBeforeChange={(editor, data, newValue) => {
      l.setValue(newValue);
    }}
    {...props}
  />
));

CodeEditor.displayName = 'CodeEditor';
