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
; NASM MBR boot loader
[bits 16]                               ; 16-bit code
[org 0x0]                            ; BIOS loads us at 0x07c0:0000
dupa:
xor ax, ax
times 4 mov bx, [es:bx+0x5]
hlt
times 9 jmp dupa
`;
/* eslint-enable no-console,@typescript-eslint/no-unused-expressions */
