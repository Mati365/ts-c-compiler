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
