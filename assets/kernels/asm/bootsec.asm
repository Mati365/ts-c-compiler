; NASM MBR boot loader
[bits 16]                               ; 16-bit code
[org 0x0]                            ; BIOS loads us at 0x07c0:0000
dupa:
xor ax, ax
times 4 mov bx, [es:bx+0x5]
hlt
times 9 jmp dupa
