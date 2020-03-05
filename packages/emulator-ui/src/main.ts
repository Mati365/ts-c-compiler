import {make} from '@compiler/x86-assembler/make';

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
[bits 16]
[org 0x0]
start:
jmp dupa
lds ax, [fs:bx+0x4]
mov cl, 2
  mov cx, 2
  mov ax, 'ac'
  jmp far [cs:bx+0xFF]
  mov byte al, [bx]
  dupa2:
  int 3
  jmp word 0x7C00:0xFF
  jmp far word [cs:bx+0xFFF]
  mov ax, word [es:bx+0x5]
  jmp dupa2
  stuff: times 10 nop
  mov ax, bx

alloc_byte:
  ; left border
  mov ax, si
  mov bx, 2
  xor dx, dx
  div bx
  cmp ax, 0x0
  div bx
  sub ax, cx
  jg .jesli_wieksze
  xor bx, dx
  call test_call
  .jesli_wieksze:
    hlt
test_call:
mov ax, [bp+0x4]
times 0x2 jmp dupa
dupa:
xor ax, ax
jmp start
`;
/* eslint-enable no-console,@typescript-eslint/no-unused-expressions */
