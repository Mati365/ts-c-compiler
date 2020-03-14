/// <reference path="./types.d.ts" />

import {asm} from '@compiler/x86-assembler/asm';
import '@compiler/preprocessor';

import {ConsoleBinaryView} from '@compiler/x86-assembler/parser/compiler/view/ConsoleBinaryView';

import TEST_SOURCE from '../../../assets/kernels/asm/bootsec.asm';

const start = Date.now();
const blob = asm(TEST_SOURCE);

console.info(`Took: ${Date.now() - start}ms!`);
console.info(
  new ConsoleBinaryView(blob).serialize(),
);
