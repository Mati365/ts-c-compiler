; NASM breakpoint
; xchg bx, bx
[bits 16]
[org 0x7c00]

jmp word 0x0000:boot

boot:
  mov ax, 1
  mov bx, 3
  cmp ax, bx
  jl _b
  xchg bx, bx
  _b:
    hlt
times 510 - ($-$$) db 0
dw 0xAA55
