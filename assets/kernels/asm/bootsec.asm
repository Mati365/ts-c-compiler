org 0x7c00

mov cx, 2
lea esi, [bp+0x8]

times 510-($-$$) db 0
dw 0xaa55
