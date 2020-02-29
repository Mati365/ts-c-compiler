org 0x7c00

mov ax, word [cs:bx+0x2]
jmp far [cs:bx+2]
jmp 0x7c : 0x1

bootsec: db 0x55

times 510-($-$$) db 0
dw 0xaa55
