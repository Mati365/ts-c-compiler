; NASM breakpoint
; xchg bx, bx
[bits 16]
[org 0x7c00]

; mov al, 0x3
add bl, 0x2
; add al, 0x2
xchg bx, bx

times 510 - ($-$$) db 0
dw 0xAA55