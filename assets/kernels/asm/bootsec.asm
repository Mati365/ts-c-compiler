;cli
 ;hang:
    ;jmp hang
    ;jmp abc
    fadd dword [es:bx+0x2]
    fadd st0
    fadd dword [bx]
    fadd dword [val1]

    val1:
    ;times 5 nop
    ;abc:
    ;times 510-($-$$) db 0
    ;dw 0xAA55
