;= test: defines fixed digit
;= bin: b8ff1231c0
[bits 16]
mov ax, test2
xor ax, ax
test2 equ 0x12FF

;= test: handles negative numbers
;= bin: b8feff31c0
[bits 16]
mov ax, test2
xor ax, ax
test2 equ -0x2

;= test: calculates value with label after equ
;= bin: b8060031c09031db
[bits 16]
mov ax, test2
xor ax, ax
test2 equ label1
nop
label1:
xor bx, bx

;= test: calculates value with label after equ
;= bin: eb08b8020031c09031db
[bits 16]
jmp test_jmp
label3:
mov ax, test2
xor ax, ax
test2 equ label3
nop
xor bx, bx
test_jmp:

;= test: critical equ expressions resolve
;= bin: b8786d
stack:  equ 0x7700
line:   equ 0x778
sector: equ 0x7800
osbase: equ sector + line + stack * 2
org osbase
mov ax, osbase & 0xFFFF
