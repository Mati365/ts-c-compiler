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
