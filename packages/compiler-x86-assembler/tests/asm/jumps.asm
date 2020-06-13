;= test: explicit / implicit near / short jmp range test
;= bin: e9ee83e9f993e9f9ffeb06eb04e901009090
[bits 16]
[org 0x7C00]

jmp near -0xF
jmp near 0x0FFF
jmp near 0x7C02
jmp abc
jmp short abc
jmp near abc
nop
abc:
nop

;= test: jmp relative addresses specified by user
;= bin: ffe0e9fd8390e9f683e9f583e9f282e9ed93e9eb83e9ea83ebe8ebe6ebe8
[bits 16]
[org 0x7C00]

jmp ax
jmp -0xFFFFE
nop
abc:

jmp 0xFFFF
jmp -0xFFFF
jmp -0xFF
jmp 0xFFF
jmp 0
jmp -0xFFFFFE
jmp short -0xFFFFFE
jmp short 0x2

jmp abc

;= test: problematic CALL reg instructions
;= bin: ffd5ffd4ffd0ffd6
[bits 16]
call bp
call sp
call ax
call si

;= test: long jumps / calls
;= bin: b8007c8ed83ec606527c7c3ec706807c87db3ec706507c807c3ec706527c007cff1e507cea00ff000f9a2301f00fff160000
[bits 16]
[org 0x7C00]
mov ax, 0x7C00
mov ds, ax
mov [ds:0x7C50+2], byte 0x7C
mov word [ds:0x7C80], 0xDB87
mov word [ds:0x7C50], 0x7C80
mov word [ds:0x7C50+2], 0x7C00
call far [0x7C50]
jmp 0xF00:0xFF00
call 0xFF0:0x123
call [0x0]
