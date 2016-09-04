; NASM breakpoint
; xchg bx, bx
[bits 16]
[org 0x7c00]

jmp word 0x0000:boot

boot:
  mov ax, 0x1
  not ax
  xchg bx, bx
  hlt
times 510 - ($-$$) db 0
dw 0xAA55
