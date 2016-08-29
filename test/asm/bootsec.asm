; NASM breakpoint
; xchg bx, bx
[bits 16]
[org 0x7c00]

; mov al, 0x3
; mov bh, 2
; add byte [0xFF], 2
;mov bx, 3
;mov ax, 4
; mov ax, 2
; mov ds, ax
add word al, 0x108
xchg bx, bx

times 510 - ($-$$) db 0
dw 0xAA55