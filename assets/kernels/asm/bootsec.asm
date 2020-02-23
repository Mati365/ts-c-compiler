org 0x7c00

jmp dupa
int 3
mov ax, word 2
dupa:
mov al, byte 1

bootsec: db 0x55

times 510-($-$$) db 0
dw 0xaa55
