org 0x7c00

dupa:
int3
jmp word 0x7C00:0xFF
jmp far word [cs:bx+0xFFF]
mov ax, word [es:bx+0x5]
jmp dupa

; bootsec: db 0x55

; times 510-($-$$) db 0
; dw 0xaa55
