[bits 16]
jmp test_jmp
label3:
mov ax, test2
xor ax, ax
test2 equ label3
nop
xor bx, bx
test_jmp:
