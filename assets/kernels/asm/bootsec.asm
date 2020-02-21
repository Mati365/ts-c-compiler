org 0x7c00

int 3
mov al, byte [si + 0x5]

times 510-($-$$) db 0
dw 0xaa55
