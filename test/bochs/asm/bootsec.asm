; NASM breakpoint
  ; xchg bx, bx
[bits 16]
[org 0x7c00]

jmp word 0x0000:boot

boot:
  mov al, 0x3
  int 10h

  mov ah, 0x9
  mov al, 65
  mov bh, 0
  mov bl, 0xF
  mov cx, 2
  int 10h
  hlt

times 510 - ($-$$) db 0
dw 0xAA55