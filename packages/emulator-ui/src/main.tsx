/// <reference path="./types.d.ts" />

import React from 'react';
import ReactDOM from 'react-dom';

import {asm} from '@compiler/x86-assembler';

import {ConsoleBinaryView} from '@compiler/x86-assembler/parser/compiler/view/ConsoleBinaryView';

import TEST_SOURCE from '../../../assets/kernels/asm/bootsec.asm';
import {Terminal} from './terminal/Terminal';

const start = Date.now();
const blob = asm(TEST_SOURCE);

console.info(`Took: ${Date.now() - start}ms!`);
console.info(
  new ConsoleBinaryView(blob).serialize(),
);

blob.andThen(
  (result) => {
    /** Init terminal */
    ReactDOM.render(
      <Terminal
        binary={
          Buffer.from(result.output.getBinary())
        }
      />,
      document.getElementById('react-root'),
    );

    return null;
  },
);
