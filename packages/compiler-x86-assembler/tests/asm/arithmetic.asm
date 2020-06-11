;= test: handle sign extend instructions
;= bin: bfffff83ef7f81efa00083ef0181efff0083efee83c77f81c7a00083c70181c7ff0083c7ee83efff83eff183ef0083eff183ef0081ef02ff83c77f83c7fe81ef0ff083ef0181c2300c81ea300c83c2ff83c7ff
[bits 16]
[org 0x7C00]
mov di, 0xFFFF
sub di, 0b01111111
sub di, 0xA0
sub di, 0x1
sub di, 0xFF
sub di, 0xFFEE
add di, 0b01111111
add di, 0xA0
add di, 0x1
add di, 0xFF
add di, 0xFFEE
sub di, -0x1
sub di, -0xF
sub di, 0x0
sub di, -0xF
sub di, 0x0
sub di, -0xFE
add di, 0x7F
add di, 0xFFFE
sub di, -0xFF1
sub di, -0xFFFF
add dx, 0xc30
sub dx, 0xc30
add dx, -0x1
add di, 0xFFFF

;= test: proper handle digits encoding
;= bin: b4c8b4c7b4c8b4c8b41ab4e6b4c8b4c8b4c8b4c8b4c8b4ffb405b081cd0a
[bits 16]
[org 0x7C00]

mov ah, 0c8h
mov ah, $0c7
mov ah, 0xc8
mov ah, 0hc8
mov ah, 01ah
mov Ah, -01ah
mov ah, 200
mov ah, 0200
mov ah, 0200d
mov ah, 0d200
mov ah, 11001000b
mov ah, 11111111y
mov ah, 0b000101
mov al, -11_11111b
int 0ah

;= test: handle separator in digits
;= bin: 00ffb00f
[bits 16]
[org 0x7C00]

test_equ equ 0b11_11
test_equ2: dw 0xFF_00

mov al, 0b11_11
