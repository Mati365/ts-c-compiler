cli
 hang:
    jmp hang
    jmp abc
    times 5 nop
    abc:
    times 510-($-$$) db 0
    dw 0xAA55
