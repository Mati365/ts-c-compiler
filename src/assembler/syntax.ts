import {tagFunction} from './utils/tagFunction';
import {
  compile,
  ast,
  lexer,
} from './parser';

/**
 * Root of evil
 *
 * @param {String} code
 */
const make = tagFunction(
  (code: string) => compile(ast(lexer(code))),
);

/* eslint-disable no-console,@typescript-eslint/no-unused-expressions */
make`
  label:
  mov al, bl
  .abc:
  mov ax, word [ds:bx+cx*4+10+5] ; testowy komentarz
  ; mov ax, byte [ds:bx+cx+10+5] ; testowy komentarz
`;
/* eslint-enable no-console,@typescript-eslint/no-unused-expressions */
