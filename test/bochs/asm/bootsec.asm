; NASM breakpoint
; xchg bx, bx
[bits 16]
[org 0x7c00]

jmp word 0x0000:boot

boot:
  mov byte [0x0], 0x1
  mov byte [0x1], 0x2
  mov byte [0x2], 0x3

  mov cx, 0x3
  mov si, 0x0
  mov di, 0x3
  rep movsb
  xchg bx, bx

times 510 - ($-$$) db 0
dw 0xAA55
