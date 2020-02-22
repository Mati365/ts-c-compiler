org 0x7c00

mov al, [si + bootsec]

bootsec: db 0x55

times 510-($-$$) db 0
dw 0xaa55
