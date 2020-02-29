org 0x7c00

dupa:
; mov ax, word [cs:bx+0x2]
; jmp far [cs:bx+2]
jmp dupa:dupa
;dupa:
;  mov ax, word [cs:bx+0x2]
;  int 3
;  jmp dupa
bootsec: db 0x55

times 510-($-$$) db 0
dw 0xaa55
