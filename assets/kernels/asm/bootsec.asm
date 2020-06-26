xor ax, ax
mov dx, 0x3b4
in al, dx
xchg bx, bx
hlt

times 510-($-$$) db 0x4f
db 0x55, 0xaa
