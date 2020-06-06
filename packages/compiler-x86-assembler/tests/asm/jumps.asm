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
