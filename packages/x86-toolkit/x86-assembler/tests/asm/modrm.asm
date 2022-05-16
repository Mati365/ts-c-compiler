;= test: handle 16bit unsigned offset and various mod rm encoding
;= bin: 2effafff003b87fc05ff2604fac6010fc6010f
[bits 16]
[org 0x7C00]
jmp far [cs:bx+0xFF]
cmp ax, [bx-64004]
jmp [0xf9fe + 0x06]
mov byte [bx+di], 0xF
mov byte [di+bx], 0xF

;= test: advanced math with brackets in modrm
;= bin: 8d45088d45088b4548
[bits 16]
[org 0x7C00]
lea ax,[di+(0x04*2)]
lea ax, [di+(0x4*2)]
mov ax, [di+(0x4*2+(8*8))]
