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
  mov cl, 2
  mov cx, 2
  mov ax, 'ac'
  jmp far [cs:bx+0xFF]
  mov byte al, [bx]
  dupa:
  int 3
  jmp word 0x7C00:0xFF
  jmp far word [cs:bx+0xFFF]
  mov ax, word [es:bx+0x5]
  jmp dupa
  stuff: db 0xFF, 0x75, "abcdefghijktlmneoprste"
  mov ax, bx
*/

/* eslint-disable no-console,@typescript-eslint/no-unused-expressions */
make`
mov bx, bx
test:
mov cl, 2
mov cx, 2
mov ax, 'ac'
jmp far [cs:bx+0xFF]
mov byte al, [bx]
dupa:
int 3
jmp word 0x7C00:0xFF
jmp far word [cs:bx+0xFFF]
mov ax, word [es:bx+0x5]
jmp dupa
stuff: db 0xFF, 0x75, "abcdefghijktlmneoprste"
mov ax, bx
jmp test
mov ax, dupa
`;
/* eslint-enable no-console,@typescript-eslint/no-unused-expressions */
