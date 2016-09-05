; NASM breakpoint
; xchg bx, bx
[bits 16]
[org 0x7c00]

jmp word 0x0000:boot

boot:
  mov ax, 0xb800
  mov es, ax
  mov bx, 0x0
  mov byte [es:bx], 0x07
  mov byte [es:bx+1], 0x11

  mov ah, 0x0
  int 10h
  hlt
times 510 - ($-$$) db 0
dw 0xAA55
