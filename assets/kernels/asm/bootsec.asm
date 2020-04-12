; Tetris
[org 7c00h]

finit
fld dword [val_dd]
fld dword [val_dd_2]
;fld st0
fstp st0

xchg bx, bx
hlt

val_dd: dd 124.5
val_dd_zero: dd 0
val_dd_2: dd 321.5
val_dd_out: dd 0

; At the end we need the boot sector signature.
times 510-($-$$) db 0
	db 0x55
	db 0xaa
