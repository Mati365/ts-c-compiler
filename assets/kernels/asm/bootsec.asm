[bits 16]
[org 0x0]
; dt 1.5
; dq 1.123
; dd 1.4
start:
mov ax, 'a '+2
jmp dupa
xor ax, ax
lds ax, [fs:bx+0x4]
mov cl, 2
  mov cx, 2
  mov ax, 'ac'
  jmp far [cs:bx+0xFF]
  mov byte al, [bx]
  .dupa2:
  int 3
  jmp word 0x7C00:0xFF
  jmp far word [cs:bx+0xFFF]
  mov ax, word [es:bx+0x5]
  jmp .dupa2
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
  loop alloc_byte
test_call:
mov ax, [bp+0x4]
times 0x2 jmp dupa
dupa:
xor ax, ax
jmp start

;finit
finit
; fld dword [val1]
; fld qword [val1]
; fld tword [val1]
fadd st1
fadd st0, st1
fadd st2, st0
faddp st0, st0
fcom

test_equ equ $
;val1: dq 0.1
call start
nop
test2:
xor ax, ax
mov ax, dupa3
dupa3 equ 4*4+5+test_equ
test3:

mov dx, test_equ
