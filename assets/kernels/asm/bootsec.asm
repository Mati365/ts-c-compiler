org 0x7c00

int3
hlt
abc:
mov al, 3
jmp abc
jmp dupa_blada
int 32
dupa_blada:
int 4

bootsec: db 0x55

times 510-($-$$) db 0
dw 0xaa55
