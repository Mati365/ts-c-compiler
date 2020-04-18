;= test: handle imul two operands as three
;= bin: f7ee6bc0026bc0026bdb026bcb076bd0056bc0f16bc0f16bc00f0fa4d806
[bits 16]
[org 0x7c00]
imul si
imul ax, 0x2
imul ax, 0x2
imul bx, 0x2
imul cx, bx, 0x7
imul dx, ax, 0x5
imul ax, -0xF
imul ax, - 0xF
imul ax, + 0xF
shld ax, bx, 0x6

;= test: handle shrink size in byte address of previous instruction
;= bin: 9bdbe3df2e137cdf161b7ca11b7c87dbf4fe00feff0000000000000000
; Tetris
[org 7c00h]
finit
fild qword [b]
fist word [output]
mov ax, word [output]
xchg bx, bx
hlt

c: dw 0xFE
b: dq 0xFFFE
output: dw 0
