; NASM breakpoint
; xchg bx, bx
[bits 16]
[org 0x7c00]

jmp word 0x0000:boot

boot:
  ; should be 8
  xor ax, ax
  xor bx, bx
  xor dx, dx
  mov dx, 0x1
  mov ax, 0x31
  mov cx, 3
  idiv cx
  xchg bx, bx
times 510 - ($-$$) db 0
dw 0xAA55
