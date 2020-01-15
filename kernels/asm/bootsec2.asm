org 0x7c00

mov byte al, [token]
mov byte [tmp], al
xchg bx, bx
hlt

token db 2
tmp	db 0

times 510-($-$$) db 0
dw 0xaa55
