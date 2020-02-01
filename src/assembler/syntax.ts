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
const compile = tagFunction((code: string) => {
  ast(lexer(code));
});

/* eslint-disable @typescript-eslint/no-unused-expressions */
compile`
  mov ax, bx
  mov cx, ah
  int 31h
`;
/* eslint-enable @typescript-eslint/no-unused-expressions */
