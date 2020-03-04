[bits 16]                               ; 16-bit code
[org 0x0]
start:
jmp dupa                           ; BIOS loads us at 0x07c0:0000
times 0xFF jmp dupa
dupa:
xor ax, ax
jmp start
