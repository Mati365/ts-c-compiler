org 0x7c00

adc al, 2
adc ax, 2
adc al, [0xF]
mov cl, 2
mov cx, 2
mov ax, 'ac'
jmp far [cs:bx+0xFF]
mov byte al, [bx]
dupa:
int 3
jmp word 0x7C00:0xFF
jmp far word [cs:bx+0xFFF]
mov ax, word [es:bx+0x5]
jmp dupa
stuff: db 0xFF, 0x75, "abcdefghijktlmneoprste"
mov ax, bx
; times 510-($-$$) db 0
; dw 0xaa55
