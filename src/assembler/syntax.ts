import {tagFunction} from './utils/tagFunction';
import {ast, lexer} from './parser';

/**
 * Root of evil
 *
 * @param {String} code
 */
const compile = tagFunction((code: string) => ast(lexer(code)));

/* eslint-disable no-console,@typescript-eslint/no-unused-expressions */
console.log(compile`
  mov al, bl
  ; mov al, byte [ds:bx+5]
  ; mov ax, byte [ds:bx+cx*4+10+5] ; testowy komentarz
  ; mov ax, byte [ds:bx+cx+10+5] ; testowy komentarz
  ; brajan
  ; mov ax, ax
`);
/* eslint-enable no-console,@typescript-eslint/no-unused-expressions */
