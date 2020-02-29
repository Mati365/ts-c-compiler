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

/*
  Best way to test if jmps works ok:
  jnc kill
  int3
  mov al, byte 2
  shit
  kill:
  mov al, byte 4
*/

/* eslint-disable no-console,@typescript-eslint/no-unused-expressions */
make`
  mov al, byte 0xFFF
  ; mov al, byte 0xFFF
  ; jmp byte 0x7c00:0x1234
  ; dupa:
  ; mov ax, word [cs:bx+0x2]
  ; int 3
  ; jmp dupa
`;
/* eslint-enable no-console,@typescript-eslint/no-unused-expressions */
