; NASM breakpoint
; xchg bx, bx
[bits 16]
[org 0x7c00]

mov al, 1
mov ah, al

times 510 - ($-$$) db 0
dw 0xAA55