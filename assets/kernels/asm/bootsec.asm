org 0x7c00

jnc kill
int3
mov al, byte 2
times 110 db 0xFF
kill:
mov al, byte 4

bootsec: db 0x55

times 510-($-$$) db 0
dw 0xaa55
