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
  mov cx, [ds:si * 4 + cx + 16]
  mov ax, bx
  mov cx, ah
  int 0x31
`);
/* eslint-enable no-console,@typescript-eslint/no-unused-expressions */
