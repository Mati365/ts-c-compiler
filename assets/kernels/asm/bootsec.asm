; Tetris
[org 7c00h]

finit
fld qword [a]
fld qword [b]
faddp st1, st0
; fsubp
; fstp st0

xchg bx, bx
hlt

a: dq 124.5
b: dq 3.0

output: dd 0

; At the end we need the boot sector signature.
times 510-($-$$) db 0
	db 0x55
	db 0xaa
