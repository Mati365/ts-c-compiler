[bits 16]
[org 0x7c00]

mov bx, 2
mov di, 4

lea cx, [bx+di]
; add [fs:bx+ax], cl
xchg bx, bx

times 510 - ($ - $$) db 0
dw 0xaa55