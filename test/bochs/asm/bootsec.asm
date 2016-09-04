; NASM breakpoint
; xchg bx, bx
[bits 16]
[org 0x7c00]

jmp word 0x0000:boot

boot:
  ; should be 8
  mov  al, -4
  mov  bl, 4
  imul bl
  xchg bx, bx
times 510 - ($-$$) db 0
dw 0xAA55
