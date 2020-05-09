;= test: handle sign extend instructions
;= bin: bfffff83ef7f81efa00083ef0181efff0083efee83c77f81c7a00083c70181c7ff0083c7ee83efff83eff183ef0083eff183ef0081ef02ff83c77f83c7fe81ef0ff083ef01
[bits 16]
[org 0x7c00]
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
