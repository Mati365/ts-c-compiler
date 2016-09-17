org 7c00h
bits 16

start:

    mov ax, 0B800h
    mov es, ax

    loop:
    mov bl, al
    mov byte [es:bx], al
    mov byte [es:bx+1], al
    add al, 1
    add bx, ax
    jmp loop

    ret
    hlt

times 510 - ($ - start) db 0
db 0x55
db 0xAA