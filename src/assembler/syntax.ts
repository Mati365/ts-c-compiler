import {tagFunction} from './utils/tagFunction';

import {
  ast,
  lexer,
} from './parser';

/**
 * Root of evil
 *
 * @param {String} code
 */
const compile = tagFunction((code: string) => ast(lexer(code)));

/* eslint-disable no-console,@typescript-eslint/no-unused-expressions */
console.log(compile`
  mov cx, [cx + si*4 + 8]
  mov ax, bx
  mov cx, ah
  int 31h
`);
/* eslint-enable no-console,@typescript-eslint/no-unused-expressions */
