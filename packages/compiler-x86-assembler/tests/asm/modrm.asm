;= test: handle 16bit unsigned offset
;= bin: 2effafff003b87fc05ff2604fa
[bits 16]
[org 0x7C00]
jmp far [cs:bx+0xFF]
cmp ax, [bx-64004]
jmp [0xf9fe + 0x06]
